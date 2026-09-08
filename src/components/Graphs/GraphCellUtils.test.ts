import {describe, expect, it} from "vitest";
import {hasCellId, isNonFunctionCell} from "./GraphCellUtils";
import {isListLabelCell} from "./GraphLabelUtils";

describe("graph cell classification", () => {
    it.each([
        ["0", true],
        ["Nonfunctional-[2:1]", true],
        ["", false],
        [null, false],
    ])("checks whether cell ID %s is present", (id, expected) => {
        expect(hasCellId(id as string | null)).toBe(expected);
    });
    it.each([
        ["Nonfunctional-[2:1,3:1]", true],
        ["Functional-1:1", false],
        ["edge-1", false],
        [null, false],
    ])("classifies %s", (id, expected) => {
        expect(isNonFunctionCell({getId: () => id as string | null})).toBe(expected);
    });

    it("does not confuse stakeholders with list labels", () => {
        const cell = {getId: () => "Nonfunctional-[4:1]", getStyle: () => ({shape: "actor"})};
        expect(isNonFunctionCell(cell)).toBe(true);
        expect(isListLabelCell(cell)).toBe(false);
    });
});
