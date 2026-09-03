import {describe, expect, it} from "vitest";
import {getListLabelArea, LIST_LABEL_AREAS, makeHtmlListLabel} from "./GraphLabelUtils";

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
