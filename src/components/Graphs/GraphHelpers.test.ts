import { describe, it, expect } from "vitest";
import { makeLabelForGoalType } from "../utils/GraphUtils";
import {SymbolKey} from "../utils/GraphConstants.tsx";

describe("makeLabelForGoalType", () => {
    it("uses ',\\n' separator when type is STAKEHOLDER", () => {
        const items = ["A", "B", "C"];
        const result = makeLabelForGoalType(items, "STAKEHOLDER");

        expect(result).toBe("A,\nB,\nC");
    });

    it.each(["FUNCTIONAL", "EMOTION", "NEGATIVE", "QUALITY"])(
        "uses default ', ' separator for %s type, and breaks lines according to square layout",
        (type) => {
            const items = ["A", "B", "C"];
            const result = makeLabelForGoalType(items, type as SymbolKey);
            expect(result).toBe("A, B,\nC");
        }
    );

    it("uses default ', ' separator when type is undefined", () => {
        const items = ["A", "B"];
        const result = makeLabelForGoalType(items, undefined);

        expect(result).toBe("A, B");
    });

    it.each(["FUNCTIONAL", "STAKEHOLDER", "EMOTION", "NEGATIVE", "QUALITY"])(
        "should handle empty array for %s type", 
        (type) => {
            const items: string[] = [];
            const result = makeLabelForGoalType(items, type as SymbolKey);

            expect(result).toBe("");
        }
    );
});
