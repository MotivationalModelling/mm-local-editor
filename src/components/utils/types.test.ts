import {describe, expect, it} from "vitest";
import {ClusterGoalSchema, GoalBaseSchema} from "./types";

const validGoal = {
    GoalID: 1,
    instanceId: "-1:2",
    GoalType: "Functional",
    GoalContent: "Goal content",
    GoalNote: "Goal note",
    GoalColor: "#ffffff"
};

describe("GoalBaseSchema", () => {
    it("accepts a valid string instance ID", () => {
        expect(GoalBaseSchema.safeParse(validGoal).success).toBe(true);
    });

    it("rejects a non-string instance ID", () => {
        // Parsed project data is untrusted, so the schema still validates at runtime.
        expect(GoalBaseSchema.safeParse({...validGoal, instanceId: 1}).success).toBe(false);
    });
});

describe("ClusterGoalSchema", () => {
    it("preserves related links on parent and nested goals", () => {
        const child = {...validGoal, url: "https://example.com/child", SubGoals: []};
        const cluster = {...validGoal, url: "https://example.com/root", SubGoals: [child]};
        const parsed = ClusterGoalSchema.parse(cluster);

        expect(parsed.url).toBe(cluster.url);
        expect(parsed.SubGoals[0].url).toBe(child.url);
    });
});
