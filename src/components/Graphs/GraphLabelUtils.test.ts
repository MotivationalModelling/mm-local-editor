import {describe, expect, it} from "vitest";
import {convertEditingValueToList, convertListToEditingValue, getListLabelArea, LIST_LABEL_AREAS, makeHtmlListLabel, normalizeListLabelItems} from "./GraphLabelUtils";

describe("makeHtmlListLabel", () => {
    it("formats each item as a list item", () => {
        const result = makeHtmlListLabel(["A", "B", "C"]);

        expect(result).toBe('<div style="align-items:center;box-sizing:border-box;display:flex;height:100%;width:100%"><ul style="box-sizing:border-box;display:block;margin:0;overflow-wrap:anywhere;padding-left:1.2em;text-align:left;white-space:normal;width:100%"><li>A</li><li>B</li><li>C</li></ul></div>');
    });

    it("trims items, ignores empty values, and escapes HTML", () => {
        const result = makeHtmlListLabel([" Research < Development ", "", 'Safe & "Responsible"']);

        expect(result).toBe('<div style="align-items:center;box-sizing:border-box;display:flex;height:100%;width:100%"><ul style="box-sizing:border-box;display:block;margin:0;overflow-wrap:anywhere;padding-left:1.2em;text-align:left;white-space:normal;width:100%"><li>Research &lt; Development</li><li>Safe &amp; &quot;Responsible&quot;</li></ul></div>');
    });

    it("returns an empty label when there are no items", () => {
        expect(makeHtmlListLabel([])).toBe("");
    });

    it("escapes every HTML delimiter without URL-encoding Unicode or newlines", () => {
        expect(makeHtmlListLabel([`<>&\"' 中文😀\nnext`])).toContain("&lt;&gt;&amp;&quot;&#39; 中文😀\nnext");
    });

    it("preserves empty entries and whitespace when converting the stored format", () => {
        const value = " First ,, Third ";
        expect(convertEditingValueToList(value)).toEqual([" First ", "", " Third "]);
        expect(convertListToEditingValue(convertEditingValueToList(value))).toBe(value);
    });

    it("normalizes HTML line endings for display without changing model input", () => {
        const items = ["A\r\nB\rC\0D"];
        expect(normalizeListLabelItems(items)).toEqual(["A\nB\nC\uFFFDD"]);
        expect(items).toEqual(["A\r\nB\rC\0D"]);
    });
});

describe("list label areas", () => {
    it.each(Object.keys(LIST_LABEL_AREAS))("keeps the %s label area inside its shape", (shape) => {
        const labelArea = getListLabelArea(shape)!;

        expect(labelArea.x).toBeGreaterThanOrEqual(0);
        expect(labelArea.y).toBeGreaterThanOrEqual(0);
        expect(labelArea.x + labelArea.width).toBeLessThanOrEqual(1);
        expect(labelArea.y + labelArea.height).toBeLessThanOrEqual(1);
    });

    it("places the Feel label area above the Concern label area", () => {
        const feelArea = LIST_LABEL_AREAS.heartShape;
        const concernArea = LIST_LABEL_AREAS.negativeShape;
        const feelCenter = feelArea.y + feelArea.height / 2;
        const concernCenter = concernArea.y + concernArea.height / 2;

        expect(feelCenter).toBeLessThan(concernCenter);
    });
});
