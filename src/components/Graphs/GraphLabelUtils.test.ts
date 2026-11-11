// @vitest-environment jsdom
import {describe, expect, it} from "vitest";
import {convertEditingValueToList, convertListToEditingValue, getListLabelArea, LIST_LABEL_AREAS, normaliseListLabelItems} from "./GraphLabelUtils";
import {makeHtmlListLabel} from "./GraphListLabel";

describe("makeHtmlListLabel", () => {
    it("formats each item as a list item", () => {
        const result = makeHtmlListLabel(["A", "B", "C"]);

        const label = document.createElement("div");
        label.innerHTML = result;
        expect(Array.from(label.querySelectorAll("li"), item => item.textContent)).toEqual(["A", "B", "C"]);
        expect(label.querySelector("ul")?.classList.contains("graph-list-label-items")).toBe(true);
        expect(label.querySelector("[style]")).toBeNull();
    });

    it("trims items, ignores empty values, and escapes HTML", () => {
        const result = makeHtmlListLabel([" Research < Development ", "", 'Safe & "Responsible"']);

        const label = document.createElement("div");
        label.innerHTML = result;
        expect(Array.from(label.querySelectorAll("li"), item => item.textContent))
            .toEqual(["Research < Development", 'Safe & "Responsible"']);
    });

    it("returns an empty label when there are no items", () => {
        expect(makeHtmlListLabel([])).toBe("");
    });

    it("escapes every HTML delimiter without URL-encoding Unicode or newlines", () => {
        const text = `<>&\"' 中文😀\nnext`;
        const label = document.createElement("div");
        label.innerHTML = makeHtmlListLabel([text]);
        expect(label.querySelector("li")?.textContent).toBe(text);
        expect(label.querySelector("li")?.children).toHaveLength(0);
    });

    it("preserves empty entries and whitespace when converting the stored format", () => {
        const value = " First ,, Third ";
        expect(convertEditingValueToList(value)).toEqual([" First ", "", " Third "]);
        expect(convertListToEditingValue(convertEditingValueToList(value))).toBe(value);
    });

    it("normalizes HTML line endings for display without changing model input", () => {
        const items = ["A\r\nB\rC\0D"];
        expect(normaliseListLabelItems(items)).toEqual(["A\nB\nC\uFFFDD"]);
        expect(items).toEqual(["A\r\nB\rC\0D"]);
    });
});

describe("label field encoding", () => {
    it.each([
        ["Careful, responsible", "Second"],
        ['Say "hello"', '"quoted", with comma'],
        ["", "First, second", ""],
        ["中文，标点", "emoji 😀", "line\nbreak"],
    ])("round-trips punctuation and empty items: %j", (...items) => {
        expect(convertEditingValueToList(convertListToEditingValue(items))).toEqual(items);
    });

    it("reads quoted fields alongside legacy newline-separated fields", () => {
        expect(convertEditingValueToList('First,\n"Second, third",\nLast')).toEqual(["First", "Second, third", "\nLast"]);
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
