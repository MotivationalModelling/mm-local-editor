import type {InstanceId, TreeGoal} from "../types";
import type {UserStory} from "../userStoryTypes";
import type {ExtractedModel, ModelEpic} from "./modelExtractor";

export type EpicStoryGroup = {epic: ModelEpic | null; stories: UserStory[]};

// Resolve from the current tree so moving a leaf immediately changes its group.
// Keep deleted or no-longer-terminal sources visible without guessing ownership.
export function groupStoriesByEpic(model: ExtractedModel, stories: UserStory[]): EpicStoryGroup[] {
  const groups: EpicStoryGroup[] = model.epics.map((epic) => ({epic, stories: []}));
  const byEpic = new Map(groups.map((group) => [group.epic!.instanceId, group]));
  const sources = new Map(model.stories.map((source) => [source.functionalGoalInstanceId, source]));
  const unlinked: EpicStoryGroup = {epic: null, stories: []};
  for (const story of stories) {
    const source = story.functionalGoalInstanceId ? sources.get(story.functionalGoalInstanceId) : undefined;
    const group = source ? byEpic.get(source.epicInstanceId) : undefined;
    (group ?? unlinked).stories.push(story);
  }
  if (unlinked.stories.length) groups.push(unlinked);
  return groups;
}

export function appendGoalToInstance(tree: TreeGoal[], parentInstanceId: InstanceId, goal: TreeGoal): TreeGoal[] {
  return tree.map((node) => ({
    ...node,
    children: node.instanceId === parentInstanceId
      ? [...(node.children ?? []), goal]
      : appendGoalToInstance(node.children ?? [], parentInstanceId, goal),
  }));
}

export function newFunctionalGoal(content: string, goals: Record<number, TreeGoal>): TreeGoal {
  let id = Date.now();
  while (goals[id]) id++;
  return {id, instanceId: `${id}-1`, type: "Do", content: content.trim(), children: []};
}
