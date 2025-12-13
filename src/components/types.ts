import {z} from "zod";

export type GoalType = "Functional" | "Quality" | "Stakeholder" | "Negative" | "Emotional"

export interface GoalBase {
    GoalID: number
    instanceId: TreeNode["instanceId"]
    GoalType: GoalType
    GoalContent: string
    GoalNote: string
    GoalColor?: string
}

export interface Goal extends GoalBase {
    Used: boolean
}

export interface GlobObject {
    [key: string]: Array<{instanceId: TreeNode["instanceId"]; content: string}>;
}

// Common base for all goal reference info
export interface GoalRefId {
  goalId: number;
  instanceId: TreeNode["instanceId"];
}

// Parsed structure for functional goals like "Functional-8-1"
export interface ParsedFunctionalId extends GoalRefId {
  type: "Functional";
}

// Parsed structure for nonfunctional goals like "Nonfunctional-[8-1;9-2]"
export interface ParsedNonFunctionalId {
  type: "Nonfunctional";
  pairs: GoalRefId[];
}

// Union type for both kinds
export type ParsedGoalId = ParsedFunctionalId | ParsedNonFunctionalId;



export interface ClusterGoal extends GoalBase {
    SubGoals: ClusterGoal[]
}

export interface GoalList extends Record<GoalType, Goal[]> {
    FunctionalNum: number
    EmotionalNum: number
    QualityNum: number
    NegativeNum: number
    StakeholderNum: number
}

export interface Cluster {
    ClusterGoals: ClusterGoal[];
}

// XXX really -- three different notes fields?!?!
export interface GoalModelProject {
    notes: string
    GoalList: GoalList
    Clusters: Cluster[]
    Notes: string
    Note: string
}

export const GoalTypeSchema = z.enum(
    ["Functional", "Quality", "Stakeholder", "Negative", "Emotional"]
);

const instanceId = z.custom<TreeNode["instanceId"]>((val) => {
  return typeof val === "string" && /^\d+-\d+$/.test(val);
});

export const GoalBaseSchema = z.object({
    GoalID: z.number(),
    instanceId: instanceId,
    GoalType: GoalTypeSchema,
    GoalContent: z.string(),
    GoalNote: z.string(),
    GoalColor: z.string()
});

export const GoalSchema = GoalBaseSchema.extend({
    Used: z.boolean()
});

export const GoalListSchema = z.object({
    FunctionalNum: z.number(),
    EmotionalNum: z.number(),
    QualityNum: z.number(),
    NegativeNum: z.number(),
    StakeholderNum: z.number(),
    Functional: GoalSchema.array(),
    Quality: GoalSchema.array(),
    Emotional: GoalSchema.array(),
    Negative: GoalSchema.array(),
    Stakeholder: GoalSchema.array()
});

// note recursive types require a bit of extra fiddling
export const ClusterGoalSchema: z.ZodType<ClusterGoal> = GoalBaseSchema.extend({
    SubGoals: z.lazy(() => ClusterGoalSchema.array())
});

export const ClusterSchema = z.object({
    ClusterGoals: ClusterGoalSchema.array()
});

export const GoalModelProjectSchema = z.object({
    notes: z.string(),
    GoalList: GoalListSchema,
    Clusters: ClusterSchema.array(),
    Notes: z.string(),
    Note: z.string(),
});

// // Define the initial tabs with labels and corresponding icons
export type InstanceId = `${number}-${number}`

// Type of the tree item content
export type TreeItem = {
    id: number;
    content: string;
    type: Label;
    instanceId: InstanceId;
    children?: TreeItem[];
    color?: string;
};

export const newTreeItem = (initFields: Pick<TreeItem, "type"> & Partial<TreeItem>): TreeItem => {
    const id = initFields.id ?? Date.now();
    const instanceId = initFields.instanceId ?? `${id}-0`;

    return {id, content: "", instanceId, ...initFields};
};

// Define the structure for the content of each tab
export type TabContent = {
    label: Label
    icon: string
    goalIds: TreeItem["id"][]
}

export type Label = "Do" | "Be" | "Feel" | "Concern" | "Who";

export interface TreeNode {
    goalId: TreeItem["id"];
    instanceId: TreeItem["instanceId"];
    children?: TreeNode[];
    color?: TreeItem["color"];
}

export const NON_FUNCTIONAL_GOAL_TYPES = ["Be", "Feel", "Concern", "Who"] as const;
export type NonFunctionalGoalType = (typeof NON_FUNCTIONAL_GOAL_TYPES)[number];
export const isNonFunctionalGoal = (
    label: Label | undefined
): label is NonFunctionalGoalType =>
    NON_FUNCTIONAL_GOAL_TYPES.includes(label as NonFunctionalGoalType);