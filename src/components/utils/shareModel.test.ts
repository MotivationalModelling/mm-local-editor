/** @vitest-environment jsdom */
import {describe, expect, it} from "vitest";

import {parseModelJson} from "../modelJson";
import {createShareUrl, decodeSharedModelHash, encodeSharedModel} from "./shareModel";

const sample = {
    tabData: [
        {label: "Do", icon: "", goalIds: [1]},
        {label: "Be", icon: "", goalIds: []},
        {label: "Feel", icon: "", goalIds: []},
        {label: "Concern", icon: "", goalIds: []},
        {label: "Who", icon: "", goalIds: []},
    ],
    treeData: [{id: 1, content: "分享中文 🎯", type: "Do", instanceId: "1:1", children: []}],
};

describe("shared model links", () => {
    it("encodes a compact URL and restores the model", () => {
        const model = parseModelJson(JSON.stringify(sample));
        const url = createShareUrl(model, "https://example.com");
        const decoded = decodeSharedModelHash(new URL(url).hash);

        expect(url).toMatch(/^https:\/\/example\.com\/mm-local-editor\/#share=/);
        expect(decoded?.tabData).toEqual(model.tabData);
        expect(decoded?.treeData[0].content).toBe("分享中文 🎯");
        expect(decoded?.treeData[0].instanceId).toBe("1-1");
    });

    it("rejects malformed links before replacing editor state", () => {
        expect(decodeSharedModelHash("#unrelated")).toBeNull();
        expect(() => decodeSharedModelHash("#share=not-valid")).toThrow();
        expect(encodeSharedModel(parseModelJson(JSON.stringify(sample)))).toMatch(/^[A-Za-z0-9_-]+$/);
    });
});
