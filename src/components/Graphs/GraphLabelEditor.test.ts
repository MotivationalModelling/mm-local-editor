// @vitest-environment jsdom
import {describe, expect, it} from "vitest";
import {makeHtmlListLabel, readListEditorValue} from "./GraphLabelUtils";

describe("list editor serialization", () => {
    it("reads the latest unsaved input and retains missing entries for validation", () => {
        const editor = document.createElement("div");
        editor.innerHTML = makeHtmlListLabel(["Old", "Second"]);
        editor.querySelectorAll("li")[0].innerHTML = "New <span>&amp; edited 中文</span>";
        editor.querySelectorAll("li")[1].textContent = "";
        expect(readListEditorValue(editor)).toBe("New & edited 中文,");
    });

    it("uses the normal editor fallback when a paste replaces the entire list", () => {
        const editor = document.createElement("div");
        editor.textContent = "First, Second";
        expect(readListEditorValue(editor)).toBeNull();
    });
});
