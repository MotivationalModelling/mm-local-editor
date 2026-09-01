import {TreeGoal} from "../types.ts";

export type StoryBlock = {
  story: string;
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

  const rootChildren = root?.children ?? [];
  for (const child of rootChildren) {
    if (child.type !== "Do") continue;

    const block: StoryBlock = {
      story: normalize(child.content),
      subTasks: [],
      qualityGoals: [],
      emotionalGoals: [],
    };

    const directChildren = child.children ?? [];
    for (const grandChild of directChildren) {
      if (grandChild.type === "Do") addUnique(block.subTasks, grandChild.content);
      if (grandChild.type === "Be") addUnique(block.qualityGoals, grandChild.content);
      if (grandChild.type === "Feel") addUnique(block.emotionalGoals, grandChild.content);
    }

    stories.push(block);
  }

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

