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

  const cp1 = storyRoles.some((role) => anyMatches(model.roles, role));
  const cp2 = storyRoles.every((role) => anyMatches(model.roles, role));
  const cp3 = stories.length === model.stories.length;
  const cp4 = storyActions.every((action) => anyMatches(model.functionalGoals, action));
  const cp5 = stories.every((story) => story.immediateUserValue.trim().length > 0);

  return [
    {id: "CP1", description: "At least one story has a role that appears in the model's roles list", passed: cp1},
    {id: "CP2", description: "All roles used in stories exist in the model's roles list", passed: cp2},
    {id: "CP3", description: "Number of stories matches number of story blocks in extracted model", passed: cp3},
    {id: "CP4", description: "Every story's action maps to a functional goal in the model", passed: cp4},
    {id: "CP5", description: "Every story has a non-empty immediate user value", passed: cp5},
  ];
}
