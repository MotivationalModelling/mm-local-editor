import { describe, it, expect } from "vitest";
import { makeLabelForGoalType } from "../utils/GraphUtils";

describe("makeLabelForGoalType", () => {
    it("uses ',\\n' separator when type is STAKEHOLDER", () => {
        const items = ["A", "B", "C"];
        const result = makeLabelForGoalType(items, "STAKEHOLDER");

        expect(result).toBe("A,\nB,\nC");
    });

    it("uses ', ' separator for other types", () => {
        const items = ["A", "B", "C"];
        const result = makeLabelForGoalType(items, "EMOTION");

        expect(result).toBe("A, B,\nC");
    });

    it("uses default ', ' separator when type is undefined", () => {
        const items = ["A", "B"];
        const result = makeLabelForGoalType(items, undefined);

        expect(result).toBe("A, B");
    });
});
