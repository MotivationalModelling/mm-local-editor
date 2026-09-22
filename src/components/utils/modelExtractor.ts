import {InstanceId, TreeGoal} from "../types.ts";
import type {UserStoryGoalReference} from "../userStoryTypes";

export type StoryGoalReference = UserStoryGoalReference & {content: string};

export type StoryBlock = {
  story: string;
  functionalGoalInstanceId: InstanceId;
  goalReferences: StoryGoalReference[];
  concerns: string[];
  roles: string[];
  subTasks: string[];
  qualityGoals: string[];
  emotionalGoals: string[];
};

export type ExtractedModel = {
  epic: string;
  roles: string[];
  functionalGoals: string[];
  qualityGoals: string[];
  emotionalGoals: string[];
  concerns: string[];
  stories: StoryBlock[];
};

const normalize = (s: string): string => s.trim();

const addUnique = (list: string[], value: string): void => {
  const normalized = normalize(value);
  if (!normalized) return;
  if (!list.some((v) => normalize(v) === normalized)) {
    list.push(normalized);
  }
};

const walkTree = (nodes: TreeGoal[], visit: (node: TreeGoal, depth: number) => void, depth = 0): void => {
  for (const node of nodes) {
    visit(node, depth);
    if (node.children && node.children.length > 0) {
      walkTree(node.children, visit, depth + 1);
    }
  }
};

export function extractModelForPrompt(treeData: TreeGoal[]): ExtractedModel {
  const root = treeData[0];

  const epic = root ? normalize(root.content) : "";
  const roles: string[] = [];
  const functionalGoals: string[] = [];
  const qualityGoals: string[] = [];
  const emotionalGoals: string[] = [];
  const concerns: string[] = [];
  const stories: StoryBlock[] = [];

  if (treeData.length > 0) {
    walkTree(treeData, (node) => {
      if (node.type === "Who") addUnique(roles, node.content);
      if (node.type === "Be") addUnique(qualityGoals, node.content);
      if (node.type === "Feel") addUnique(emotionalGoals, node.content);
      if (node.type === "Concern") addUnique(concerns, node.content);
      if (node.type === "Do" && node !== root) addUnique(functionalGoals, node.content);
    });
  }

  type StoryContext = Record<"Who" | "Be" | "Feel" | "Concern", StoryGoalReference[]>;
  const emptyContext = (): StoryContext => ({Who: [], Be: [], Feel: [], Concern: []});
  const referenceFor = (node: TreeGoal): StoryGoalReference => ({
    goalId: node.id,
    instanceId: node.instanceId,
    type: node.type,
    content: normalize(node.content),
  });
  const contents = (refs: StoryGoalReference[]): string[] => [...new Set(refs.map((ref) => ref.content))];

  // Resolve each category independently, retaining the exact instances from
  // the nearest Do ancestor when no local values are attached to this goal.
  const collectLeafStories = (node: TreeGoal, inherited: StoryContext, isEpic = false): void => {
    const context = emptyContext();
    for (const type of ["Who", "Be", "Feel", "Concern"] as const) {
      const direct = (node.children ?? [])
        .filter((child) => child.type === type && normalize(child.content))
        .map(referenceFor);
      context[type] = direct.length > 0 ? direct : inherited[type];
    }
    const doChildren = (node.children ?? []).filter((child) => child.type === "Do");

    if (!isEpic && doChildren.length === 0) {
      const story = normalize(node.content);
      if (story) {
        stories.push({
          story,
          functionalGoalInstanceId: node.instanceId,
          goalReferences: [referenceFor(node), ...context.Who, ...context.Be, ...context.Feel, ...context.Concern],
          concerns: contents(context.Concern),
          roles: contents(context.Who),
          subTasks: [],
          qualityGoals: contents(context.Be),
          emotionalGoals: contents(context.Feel),
        });
      }
      return;
    }

    for (const child of doChildren) collectLeafStories(child, context);
  };

  if (root) collectLeafStories(root, emptyContext(), true);

  return {
    epic,
    roles,
    functionalGoals,
    qualityGoals,
    emotionalGoals,
    concerns,
    stories,
  };
}
