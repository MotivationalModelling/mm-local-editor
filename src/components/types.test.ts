import {describe, expect, it} from "vitest";
import {GoalBaseSchema} from "./types";

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
