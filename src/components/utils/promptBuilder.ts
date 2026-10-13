import type {ExtractedModel} from "./modelExtractor";

export function buildUserStoryPrompt(model: ExtractedModel, projectBackground: string): string {
  const normalizedProjectBackground = projectBackground.trim();
  if (normalizedProjectBackground.length === 0) {
    throw new Error("Project background is required to generate user stories.");
  }

  const targetFunctionalLeafGoals = model.stories.map((story) => ({
    functionalGoalInstanceId: story.functionalGoalInstanceId,
    "Functional goal": story.story,
    "Roles List": story.roles,
    "Quality goals": story.qualityGoals,
    "Emotional goals": story.emotionalGoals,
    Concerns: story.concerns,
    relatedGoalInstanceIds: story.goalReferences.map((goal) => goal.instanceId),
  }));
  const modelInput = {
    projectBackground: normalizedProjectBackground,
    motivationalModel: model.motivationalModel,
    targetFunctionalLeafGoals,
  };

  return `You will be given a project background, a motivational model, and a set of functional goals from its leaf nodes.

UNDERSTAND THE MOTIVATIONAL MODEL:

First, understand what the motivational model represents.

A motivational model describes a system or project through its functional goals, stakeholders, quality goals, emotional goals, and concerns.

- The root represents the overall system, project, or overarching goal.
- Functional nodes (Do) represent what the system should enable or achieve. Their branches decompose broader functional goals into more specific sub-goals.
- Major functional branches represent broad capability areas and may be understood as epic-level groupings where appropriate.
- Functional leaf nodes represent the most specific functional goals in the model: Do nodes with no further functional sub-goals. Attached roles, quality goals, emotional goals, or concerns do not count as functional sub-goals.
- Roles (Who) represent stakeholders relevant to the associated functional goals.
- Quality goals (Be) describe desirable qualities of the interaction, process, or outcome.
- Emotional goals (Feel) describe how stakeholders want to feel or perceive the interaction.
- Concerns provide additional contextual information relevant to the associated functional goals.

Next, use the motivational model and project background to understand what the system is, what functions it includes, and what its stakeholders want to achieve. Understand how each functional leaf goal contributes to its broader branch and the overall system purpose.

Use this understanding internally to generate meaningful and logically consistent user stories, especially the "so that" clause. Do not output a system-understanding summary.

The motivational model is provided as context. Generate stories only for the functional leaf goals explicitly listed in \`targetFunctionalLeafGoals\`.
Generate exactly one user story for each provided functional leaf goal.

Each functional leaf goal corresponds to exactly one user story.
If a functional goal has multiple roles, include all of those roles in the same user story.

Each functional goal may include:
- Roles: represent stakeholders who are relevant to the functional goal.
- Quality goals: describe desirable qualities of the interaction, process, or outcome.
- Emotional goals: describe how stakeholders want to feel or perceive the interaction.
- Concerns: provide additional contextual information relevant to the functional goal.

INHERITANCE AND MODEL CONTEXT:

- Stakeholders (Who), quality goals (Be), and emotional goals (Feel) attached to a functional goal also apply to every functional descendant along that branch, including attachments at the root.
- Inheritance is cumulative: local stakeholders, quality goals, and emotional goals add to inherited ones; they do not replace them.
- Do not inherit from siblings or unrelated branches.
- Each target functional leaf goal's Roles List, Quality goals, and Emotional goals have already been resolved to include all applicable ancestor and local attachments.
- Use those resolved lists as the authoritative context for that leaf. Repeated labels appear once in the lists, while relatedGoalInstanceIds retains all distinct applicable instances.
- Concerns use local attachments when present, otherwise those of the nearest functional ancestor with concerns. They are not cumulatively inherited.
- The motivational model's nodes contain instanceId, type, content, and children. Non-functional children represent attachments to their parent functional goal; Do children represent functional decomposition.
- Use the full hierarchy to understand purpose and existing capabilities. Do not generate extra stories for root or intermediate nodes, or for leaves outside targetFunctionalLeafGoals.

GROUNDING RULES:

- Use only the provided motivational model, project background, and information associated with the current functional goal.
- Use the overall system and its existing functions to understand the current goal's purpose and value, without adding those other functions to the current story's action.
- Do not invent requirements, functionality, stakeholders, goals, or constraints that are not supported by the provided information.
- Do not transfer roles, quality goals, emotional goals, or concerns from unrelated functional goals. Ancestor stakeholders, quality goals, and emotional goals are relevant under the explicit inheritance rules above.
- Do not introduce assumptions unless they are necessary to make the sentence grammatical.
- You may derive a direct business value from the provided information, but do not add unsupported facts or assumptions to justify it.
- Preserve the original meaning and scope of the functional goal.


USER STORY FORMAT

Each user story must follow this format:

As a <role>, I want to <functional goal> so that <business value>.

STEPS TO GENERATE USER STORIES:

STEP 1: INCLUDE THE ROLES

Include all roles associated with the current functional goal in the user story.

- Use every role exactly as written in the provided Roles List.
- Do not select, omit, invent, rename, generalise, or merge roles.
- If multiple roles are provided, include all of them in the same user story.
- If no roles are provided, use "user".


STEP 2: EXPRESS THE FUNCTIONAL GOAL

Use the provided functional goal as the action after "I want to".

- You may make minor grammatical changes so that it reads naturally after "I want to".
- The words "I want to" are mandatory in every sentence, followed by a base-form action verb.
- If the functional goal is a noun phrase, convert it into an action while preserving its meaning and scope. Preserve the meaning, not necessarily the exact wording.
- For example, "AI support question checking" becomes "I want to check questions with AI support", not "I want AI support question checking".
- For example, "View leaderboard" becomes "I want to view the leaderboard", not "I want a leaderboard".
- These examples illustrate grammar only; do not add their functionality to unrelated goals.
- Do not add new functionality.


STEP 3: GENERATE THE BUSINESS VALUE

Generate a meaningful business value that explains why the functional goal matters to the associated stakeholders within this system.

Business value may be a practical stakeholder benefit or a contribution to the project's stated purpose; it does not have to be financial.

To determine the business value:

1. Consider your understanding of the system, its existing functions, and the project background.
2. Consider the associated roles, their needs as supported by the provided information, and the current functional goal.
3. Consider relevant quality goals, emotional goals, and concerns as supporting context where they help explain the value.
4. Ask: "Why would these stakeholders want to perform this action, and what supported outcome does it enable in this system?"
5. Derive the most direct, meaningful outcome supported by this context.

The business value must:

- describe a benefit or outcome of the functional goal, rather than merely restating the action;
- be relevant to the associated roles;
- remain consistent with the system and project background;
- be supported by the provided functional goal and relevant context;
- not introduce new functionality or requirements;
- not invent stakeholder needs, system relationships, or downstream benefits;
- not claim outcomes beyond what the supplied information supports.
- Concerns may be used to understand the context, but do not need to be explicitly expressed in the user story.


STEP 4: INCORPORATE QUALITY AND EMOTIONAL GOALS ONLY WHEN RELEVANT

Consider the quality goals and emotional goals associated with the current functional goal.

Include them only when they materially clarify the action, interaction, or business value and are supported by the provided context.

Where relevant:

- incorporate quality goals as appropriate modifiers of the action, interaction, or outcome;
- incorporate emotional goals as appropriate descriptions of how the stakeholder experiences or perceives the interaction or outcome.

Do not include a quality goal or emotional goal merely because it is provided or can fit naturally into the sentence. Omit it when it does not meaningfully contribute to the story.

Do not force a quality goal or emotional goal into the sentence if doing so would make the sentence unnatural, change the original intent, or introduce unsupported meaning.

Do not create additional functionality merely to express a quality goal or emotional goal.


STEP 5: VALIDATE THE USER STORY

Before returning the story, check that:

- the role matches exactly to the current functional goal's Roles List;
- the functional goal preserves the original action and scope;
- the business value follows logically from the provided information and your understanding of the system and stakeholders;
- quality and emotional goals are included only where relevant;
- no unsupported information, assumption, requirement, or functionality has been introduced;
- the sentence is grammatically correct and fluent;
- every sentence contains the exact connector ", I want to " followed by an action, and " so that " followed by a non-empty benefit;
- the sentence follows:
  "As a <role>, I want to <functional goal> so that <business value>."


REQUIRED OUTPUT FORMAT

Return one JSON object with a "stories" array.

Each array item must have this shape:

{
  "functionalGoalInstanceId": "<provided Do instanceId>",
  "sentence": "As a <role>, I want to <functional goal> so that <business value>.",
  "relatedGoalInstanceIds": ["<instanceId>"]
}

Return exactly one array item per provided functional leaf goal.
Copy \`functionalGoalInstanceId\` and \`relatedGoalInstanceIds\` exactly from the input into the corresponding output item without modification.

Return only the JSON object without Markdown fences or additional text. Do not include the system-understanding process or explanations.


MODEL INPUT

${JSON.stringify(modelInput, null, 2)}`;
}
