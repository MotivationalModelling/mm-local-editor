import {ExtractedModel} from "./modelExtractor";
import {UserStory} from "../context/UserStoriesContext";

export type CPResult = {
  id: string;
  description: string;
  passed: boolean;
};

const norm = (s: string): string => s.trim().toLowerCase();

const includesCI = (haystack: string, needle: string): boolean => {
  const h = norm(haystack);
  const n = norm(needle);
  if (!h || !n) return false;
  return h.includes(n);
};

const anyMatches = (items: string[], target: string): boolean => {
  return items.some((i) => includesCI(i, target) || includesCI(target, i));
};

export function checkConsistencyPrinciples(model: ExtractedModel, stories: UserStory[]): CPResult[] {
  const storyRoles = stories.map((s) => s.role).filter((r) => r.trim().length > 0);
  const storyActions = stories.map((s) => s.action).filter((a) => a.trim().length > 0);
  const storyQualityGoals = stories.map((s) => s.qualityGoal).filter((q) => q.trim().length > 0);
  const storyEmotionalGoals = stories.map((s) => s.emotionalGoal).filter((e) => e.trim().length > 0);
  const storySubTasks = stories.flatMap((s) => s.subTasks).filter((t) => t.trim().length > 0);

  const cp1 = storyRoles.some((role) => anyMatches(model.roles, role));
  const cp2 = storyRoles.every((role) => anyMatches(model.roles, role));
  const cp3 = stories.length === model.stories.length;
  const cp4 = storyActions.every((action) => anyMatches(model.functionalGoals, action));

  const modelSubTasks = model.stories.flatMap((b) => b.subTasks).filter((t) => t.trim().length > 0);
  const cp5 = modelSubTasks.every((task) => anyMatches(storySubTasks, task));

  const cp6 = model.qualityGoals.some((q) => anyMatches(storyQualityGoals, q));
  const cp7 = storyQualityGoals.every((q) => anyMatches(model.qualityGoals, q));
  const cp8 = model.emotionalGoals.some((e) => anyMatches(storyEmotionalGoals, e));
  const cp9 = storyEmotionalGoals.every((e) => anyMatches(model.emotionalGoals, e));

  return [
    {id: "CP1", description: "At least one story has a role that appears in the model's roles list", passed: cp1},
    {id: "CP2", description: "All roles used in stories exist in the model's roles list", passed: cp2},
    {id: "CP3", description: "Number of stories matches number of story blocks in extracted model", passed: cp3},
    {id: "CP4", description: "Every story's action maps to a functional goal in the model", passed: cp4},
    {id: "CP5", description: "Every sub-task in the model appears in at least one story's subTasks", passed: cp5},
    {id: "CP6", description: "At least one quality goal from the model appears in stories", passed: cp6},
    {id: "CP7", description: "All quality goals in stories exist in the model's qualityGoals", passed: cp7},
    {id: "CP8", description: "At least one emotional goal from the model appears in stories", passed: cp8},
    {id: "CP9", description: "All emotional goals in stories exist in the model's emotionalGoals", passed: cp9},
  ];
}
