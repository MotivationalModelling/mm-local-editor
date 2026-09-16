import {z} from "zod";
import {createInstanceId, InstanceIdSchema, type InstanceId} from "./instanceId";

// ============================================
// Core types (defined first to avoid circular refs)
// ============================================
// Instance IDs live in their own module, which owns the format, the readers and the
// import schema. The type is re-exported here because callers almost always want it
// alongside the other core types; import everything else from ./instanceId.
export type {InstanceId};

export type Label = "Do" | "Be" | "Feel" | "Concern" | "Who";

export type GoalType = "Functional" | "Quality" | "Stakeholder" | "Negative" | "Emotional"

export interface GoalBase {
    GoalID: number
    instanceId: TreeGoal["instanceId"]
    GoalType: GoalType
    GoalContent: string
    GoalNote: string
    GoalColor?: string
}

export interface Goal extends GoalBase {
    Used: boolean
}

export interface GlobObject {
    [key: string]: Array<{instanceId: InstanceId; content: string}>;
}

// Common base for all goal reference info
export interface GoalRefId {
  goalId: number;
  instanceId: InstanceId;
}

// Parsed structure for functional goals like "Functional-8:1"
export interface ParsedFunctionalId extends GoalRefId {
  type: "Functional";
}

// Parsed structure for nonfunctional goals like "Nonfunctional-[8:1;9:2]"
export interface ParsedNonFunctionalId {
  type: "Nonfunctional";
  pairs: GoalRefId[];
}

// Union type for both kinds
export type ParsedGoalId = ParsedFunctionalId | ParsedNonFunctionalId;



export interface ClusterGoal extends GoalBase {
    SubGoals: ClusterGoal[]
    x?: number;
    y?: number;
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

export const GoalBaseSchema = z.object({
    GoalID: z.number(),
    instanceId: InstanceIdSchema,
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

// note recursive types require a bit of extra fiddling. The input type is left open
// because InstanceIdSchema canonicalises, so what it takes in is not what it hands back.
export const ClusterGoalSchema: z.ZodType<ClusterGoal, z.ZodTypeDef, unknown> = GoalBaseSchema.extend({
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

export type TreeGoal = {
    id: number;
    content: string;
    type: Label;
    instanceId: InstanceId;
    children?: TreeGoal[];
    color?: string;
    x?: number;
    y?: number;
};

export const newTreeGoal = (initFields: Pick<TreeGoal, "type"> & Partial<TreeGoal>): TreeGoal => {
    const id = initFields.id ?? Date.now();
    const instanceId = initFields.instanceId ?? createInstanceId(id, 0);
    return {id, content: "", instanceId, ...initFields};
};

// Define the structure for the content of each tab
export type TabContent = {
    label: Label
    icon: string
    goalIds: TreeGoal["id"][]
}

export const NON_FUNCTIONAL_GOAL_TYPES = ["Be", "Feel", "Concern", "Who"] as const;
export type NonFunctionalGoalType = (typeof NON_FUNCTIONAL_GOAL_TYPES)[number];
export const isNonFunctionalGoal = (
    label: Label | undefined
): label is NonFunctionalGoalType =>
    NON_FUNCTIONAL_GOAL_TYPES.includes(label as NonFunctionalGoalType);
