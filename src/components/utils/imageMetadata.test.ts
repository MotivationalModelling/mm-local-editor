/** @vitest-environment jsdom */
import {Blob as NodeBlob} from "node:buffer";
import {describe, expect, it} from "vitest";

import {embedJsonInPng, embedJsonInSvg, extractJsonFromPng, extractJsonFromSvg} from "./imageMetadata";

const model = {tabData: [{label: "Do", icon: "", goalIds: [1]}], treeData: [{id: 1, content: "中文 🎯"}]};
globalThis.Blob = NodeBlob as unknown as typeof Blob;

describe("image model metadata", () => {
    it("round trips UTF-8 model data in PNG while preserving image bytes", async () => {
        const original = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
        const image = await embedJsonInPng(new Blob([original], {type: "image/png"}), model);

        expect([...new Uint8Array(await image.arrayBuffer()).subarray(0, original.length)]).toEqual([...original]);
        expect(await extractJsonFromPng(image)).toEqual(model);
    });

    it("round trips UTF-8 model data in SVG", async () => {
        const image = embedJsonInSvg('<svg xmlns="http://www.w3.org/2000/svg"/>', model);
        expect(await extractJsonFromSvg(new Blob([image], {type: "image/svg+xml"}))).toEqual(model);
    });

    it("does not treat an ordinary image as an AMMBER model", async () => {
        expect(await extractJsonFromPng(new Blob(["ordinary PNG"], {type: "image/png"}))).toBeNull();
        expect(await extractJsonFromSvg(new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], {type: "image/svg+xml"}))).toBeNull();
    });
});
