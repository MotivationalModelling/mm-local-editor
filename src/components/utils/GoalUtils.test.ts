import {describe, expect, it} from "vitest";
import {isGoalEmpty, isGoalNameEmpty} from "./GoalUtils";

describe("goal emptiness", () => {
    it.each(["", "  ", "\n\t"])("rejects empty names: %j", content => {
        expect(isGoalNameEmpty(content)).toBe(true);
        expect(isGoalEmpty({content})).toBe(true);
    });
    it("accepts text without changing it", () => {
        expect(isGoalEmpty({content: " Goal "})).toBe(false);
    });
});
