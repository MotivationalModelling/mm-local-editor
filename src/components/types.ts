import {z} from "zod";

export type GoalType = "Functional" | "Quality" | "Stakeholder" | "Negative" | "Emotional"

export interface GoalBase {
    GoalID: number
    GoalType: GoalType
    GoalContent: string
    GoalNote: string
}

export interface Goal extends GoalBase {
    Used: boolean
}

export interface GlobObject {
    [key: string]: string[];
  }

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

export const GoalBaseSchema = z.object({
    GoalID: z.number(),
    GoalType: GoalTypeSchema,
    GoalContent: z.string(),
    GoalNote: z.string()
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