import {describe, it, expect, vi} from "vitest";
import {doesGoalTypeUseSeparateLines, makeLabelForGoalType} from "../utils/GraphUtils";
import type {SymbolKey} from "../utils/GraphConstants.tsx";
import {convertEditingValueToList} from "./GraphLabelUtils";

// Label formatting does not depend on palette images or shape configuration.
vi.mock("../utils/GraphConstants", () => ({SYMBOL_CONFIGS: {}}));

describe("makeLabelForGoalType", () => {
    it.each(["STAKEHOLDER", "NEGATIVE", "QUALITY", "EMOTIONAL"] as const)(
        "preserves punctuation when formatting %s", type => {
            const items = ['Careful, "responsible"', "Second"];
            expect(doesGoalTypeUseSeparateLines(type)).toBe(true);
            expect(convertEditingValueToList(makeLabelForGoalType(items, type)).map(item => item.trim())).toEqual(items);
        },
    );
    it.each(["FUNCTIONAL", undefined] as const)("does not use one item per line for %s", type => {
        expect(doesGoalTypeUseSeparateLines(type)).toBe(false);
    });
    it.each(["STAKEHOLDER", "NEGATIVE", "QUALITY", "EMOTIONAL"])(
        "uses ',\\n' separator when type is %s",
        (type) => {
            const items = ["A", "B", "C"];
            const result = makeLabelForGoalType(items, type as SymbolKey);

            expect(result).toBe("A,\nB,\nC");
        }
    );

    it("uses default ', ' separator for FUNCTIONAL and breaks lines according to square layout", () => {
        const items = ["A", "B", "C"];
        const result = makeLabelForGoalType(items, "FUNCTIONAL");

        expect(result).toBe("A, B,\nC");
    });

    it("uses default ', ' separator when type is undefined", () => {
        const items = ["A", "B"];
        const result = makeLabelForGoalType(items, undefined);

        expect(result).toBe("A, B");
    });

    it.each(["FUNCTIONAL", "STAKEHOLDER", "EMOTIONAL", "NEGATIVE", "QUALITY"])(
        "should handle empty array for %s type", 
        (type) => {
            const items: string[] = [];
            const result = makeLabelForGoalType(items, type as SymbolKey);

            expect(result).toBe("");
        }
    );
});
