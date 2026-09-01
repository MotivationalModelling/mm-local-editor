import {TreeGoal} from "../types.ts";

export type StoryBlock = {
  story: string;
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

  type StoryContext = Pick<StoryBlock, "roles" | "qualityGoals" | "emotionalGoals">;

  const emptyContext = (): StoryContext => ({roles: [], qualityGoals: [], emotionalGoals: []});

  const directValues = (node: TreeGoal, type: "Who" | "Be" | "Feel"): string[] => {
    const values: string[] = [];
    for (const child of node.children ?? []) {
      if (child.type === type) addUnique(values, child.content);
    }
    return values;
  };

  // Each category is resolved independently. Values attached directly to the
  // current Do node take precedence; a missing category inherits the nearest
  // value from its parent Do node, continuing up to the epic.
  const collectLeafStories = (node: TreeGoal, inherited: StoryContext, isEpic = false): void => {
    const directRoles = directValues(node, "Who");
    const directQualityGoals = directValues(node, "Be");
    const directEmotionalGoals = directValues(node, "Feel");
    const context: StoryContext = {
      roles: directRoles.length > 0 ? directRoles : inherited.roles,
      qualityGoals: directQualityGoals.length > 0 ? directQualityGoals : inherited.qualityGoals,
      emotionalGoals:
        directEmotionalGoals.length > 0 ? directEmotionalGoals : inherited.emotionalGoals,
    };
    const doChildren = (node.children ?? []).filter((child) => child.type === "Do");

    if (!isEpic && doChildren.length === 0) {
      const story = normalize(node.content);
      if (story) {
        stories.push({
          story,
          roles: [...context.roles],
          subTasks: [],
          qualityGoals: [...context.qualityGoals],
          emotionalGoals: [...context.emotionalGoals],
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
