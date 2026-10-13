import {InstanceId, TreeGoal} from "../types.ts";
import type {UserStoryGoalReference} from "../userStoryTypes";

export type StoryGoalReference = UserStoryGoalReference & {content: string};

export type StoryBlock = {
  story: string;
  functionalGoalInstanceId: InstanceId;
  epicInstanceId: InstanceId;
  goalReferences: StoryGoalReference[];
  concerns: string[];
  roles: string[];
  subTasks: string[];
  qualityGoals: string[];
  emotionalGoals: string[];
};

export type ModelEpic = {instanceId: InstanceId; goalId: number; title: string};

// Keep model relationships and instance identity without editor layout metadata.
export type PromptModelNode = {
  instanceId: InstanceId;
  type: TreeGoal["type"];
  content: string;
  children: PromptModelNode[];
};

export type ExtractedModel = {
  projectName: string;
  motivationalModel: PromptModelNode[];
  epics: ModelEpic[];
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

export function resolveModelTree(treeData: TreeGoal[], goals: Record<number, TreeGoal>): TreeGoal[] {
  return treeData.map((node) => ({
    ...node,
    content: goals[node.id]?.content ?? node.content,
    children: resolveModelTree(node.children ?? [], goals),
  }));
}

export function extractModelForPrompt(treeData: TreeGoal[]): ExtractedModel {
  const root = treeData[0];
  const modelNode = (node: TreeGoal): PromptModelNode => ({
    instanceId: node.instanceId,
    type: node.type,
    content: normalize(node.content),
    children: (node.children ?? []).map(modelNode),
  });
  const motivationalModel = treeData.map(modelNode);

  const projectName = root ? normalize(root.content) : "";
  const epics = (root?.type === "Do" ? root.children ?? [] : []).filter((node) => node.type === "Do").map((node) => ({
    instanceId: node.instanceId, goalId: node.id, title: normalize(node.content) || "Untitled epic",
  }));
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

  // Stakeholders, quality and emotional goals accumulate along the Do path.
  // Concerns retain the existing nearest-ancestor fallback. Sibling context
  // never enters this path; duplicate labels still retain distinct instances.
  const collectLeafStories = (node: TreeGoal, inherited: StoryContext, epicInstanceId: InstanceId | null): void => {
    const context = emptyContext();
    for (const type of ["Who", "Be", "Feel", "Concern"] as const) {
      const direct = (node.children ?? [])
        .filter((child) => child.type === type && normalize(child.content))
        .map(referenceFor);
      context[type] = type === "Concern"
        ? (direct.length > 0 ? direct : inherited[type])
        : [...new Map([...inherited[type], ...direct].map((ref) => [ref.instanceId, ref])).values()];
    }
    const doChildren = (node.children ?? []).filter((child) => child.type === "Do");

    if (epicInstanceId !== null && doChildren.length === 0) {
      const story = normalize(node.content);
      if (story) {
        stories.push({
          story,
          functionalGoalInstanceId: node.instanceId,
          epicInstanceId,
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

    for (const child of doChildren) collectLeafStories(child, context, epicInstanceId ?? child.instanceId);
  };

  if (root?.type === "Do") collectLeafStories(root, emptyContext(), null);

  return {
    projectName,
    motivationalModel,
    epics,
    roles,
    functionalGoals,
    qualityGoals,
    emotionalGoals,
    concerns,
    stories,
  };
}
