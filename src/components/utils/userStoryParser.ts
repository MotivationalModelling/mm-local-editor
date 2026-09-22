import {z} from "zod";
import type {UserStory} from "../userStoryTypes";
import type {ExtractedModel} from "./modelExtractor";
import {splitUserStorySentence} from "./userStorySentence";

const instanceIdSchema = z.string().regex(/^\d+-\d+$/);
const responseSchema = z.object({
  stories: z.array(z.object({
    functionalGoalInstanceId: instanceIdSchema,
    sentence: z.string().trim().min(1),
    relatedGoalInstanceIds: z.array(instanceIdSchema).min(1),
  })),
});

// Match complete role labels, including labels containing commas or "and".
// Only list separators and grammatical articles may appear between labels.
const matchesAllRoles = (text: string, roles: string[]): boolean => {
  if (roles.length === 0) return text === "user";
  return roles.some((role, index) => {
    if (!text.startsWith(role)) return false;
    const rest = text.slice(role.length);
    if (roles.length === 1) return rest.length === 0;
    const separator = rest.match(/^(?:,\s+(?:and\s+)?|\s+and\s+)/);
    if (!separator) return false;
    const next = rest.slice(separator[0].length);
    const remaining = roles.filter((_, roleIndex) => roleIndex !== index);
    return matchesAllRoles(next, remaining)
      || (/^an?\s+/.test(next) && matchesAllRoles(next.replace(/^an?\s+/, ""), remaining));
  });
};

// Resolve against the model snapshot used for this request, never by output
// order, goal text, or IDs invented by the model.
export function parseStoriesFromText(raw: string, model: ExtractedModel): UserStory[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    throw new Error("User stories must be returned as JSON with goal instance IDs. Please generate them again.");
  }
  const response = responseSchema.safeParse(parsed);
  if (!response.success) {
    throw new Error("The generated user stories are missing valid story fields or goal instance IDs. Please generate them again.");
  }
  if (response.data.stories.length !== model.stories.length) {
    throw new Error("The generated stories must cover every functional goal exactly once. Please generate them again.");
  }

  const sources = new Map(model.stories.map((story) => [story.functionalGoalInstanceId as string, story]));
  const storiesBySource = new Map<string, UserStory>();
  for (const story of response.data.stories) {
    const source = sources.get(story.functionalGoalInstanceId);
    if (!source || storiesBySource.has(story.functionalGoalInstanceId)) {
      throw new Error("A generated story references an unknown or duplicate functional goal instance.");
    }

    // Extract metadata from the complete sentence without rewriting the text
    // shown to the user. Keep punctuation inside clauses (e.g. version 2.5).
    const parts = splitUserStorySentence(story.sentence);
    const role = parts?.role.replace(/\s+/g, " ").trim() ?? "";
    const action = parts?.action.replace(/\s+/g, " ").trim() ?? "";
    const immediateUserValue = parts?.immediateUserValue.replace(/\s+/g, " ").trim() ?? "";
    if (!parts || !role || !action || !immediateUserValue) {
      throw new Error(`The story for "${source.story}" must be a complete "As a …, I want to … so that …" sentence.`);
    }
    if (!matchesAllRoles(parts.role, source.roles)) {
      throw new Error(`The story for "${source.story}" must use all of its associated roles exactly as provided.`);
    }

    // The response must copy the complete input list, including all roles and
    // inherited context, in the same order and without additions or omissions.
    const relatedGoals = source.goalReferences;
    const expectedIds = relatedGoals.map((goal) => goal.instanceId);
    if (story.relatedGoalInstanceIds.length !== expectedIds.length
      || expectedIds.some((id, index) => story.relatedGoalInstanceIds[index] !== id)) {
      throw new Error(`The story for "${source.story}" has missing or unrelated goal instance IDs. Please generate it again.`);
    }

    storiesBySource.set(story.functionalGoalInstanceId, {
      id: crypto.randomUUID(),
      sentence: story.sentence,
      role,
      action,
      immediateUserValue,
      subTasks: [],
      functionalGoalInstanceId: source.functionalGoalInstanceId,
      relatedGoals: relatedGoals.map(({goalId, instanceId, type}) => ({goalId, instanceId, type})),
      status: "pending",
      editedText: "",
    });
  }
  return model.stories.map((source) => storiesBySource.get(source.functionalGoalInstanceId)!);
}
