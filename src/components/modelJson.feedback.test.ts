/** @vitest-environment jsdom */
import {Blob as NodeBlob} from "node:buffer";
import {describe, expect, it} from "vitest";

import {parseModelJson} from "./modelJson";
import {embedJsonInPng, extractJsonFromPng} from "./utils/imageMetadata";
import {createShareUrl, decodeSharedModelHash} from "./utils/shareModel";

globalThis.Blob = NodeBlob as unknown as typeof Blob;

const savedModel = {
    tabData: [
        {label: "Do", icon: "", goalIds: [1]},
        {label: "Be", icon: "", goalIds: []},
        {label: "Feel", icon: "", goalIds: []},
        {label: "Concern", icon: "", goalIds: []},
        {label: "Who", icon: "", goalIds: []},
    ],
    treeData: [{id: 1, content: "Goal", type: "Do", instanceId: "1:1", children: []}],
    feedbacks: [{
        id: "feedback-1", nodeId: "Functional-1:1", nodeLabel: "Goal", author: "Reviewer",
        content: "Check this goal", createdAt: "Just now", status: "open", replyCount: 1,
        replies: [{id: "reply-1", author: "Author", content: "Updated", createdAt: "Just now"}],
    }],
    overallFeedback: {author: "Reviewer", content: "A solid starting model", updatedAt: "2026-09-28T00:00:00.000Z"},
};

describe("feedback model JSON", () => {
    it("preserves overall feedback, node comments and replies across JSON, PNG and share links", async () => {
        const parsed = parseModelJson(JSON.stringify(savedModel));
        expect(parsed.feedbacks).toEqual(savedModel.feedbacks);
        expect(parsed.overallFeedback).toEqual(savedModel.overallFeedback);

        const png = await embedJsonInPng(new Blob([new Uint8Array([137, 80, 78, 71])]), parsed);
        expect(parseModelJson(JSON.stringify(await extractJsonFromPng(png))).feedbacks).toEqual(savedModel.feedbacks);

        const shared = decodeSharedModelHash(new URL(createShareUrl(parsed, "https://example.com")).hash);
        expect(shared?.feedbacks).toEqual(savedModel.feedbacks);
        expect(shared?.overallFeedback).toEqual(savedModel.overallFeedback);
    });

    it("normalizes source repository feedback node IDs on import", () => {
        const imported = parseModelJson(JSON.stringify({
            ...savedModel,
            feedbacks: [{...savedModel.feedbacks[0], nodeId: "Functional-1-1"}],
        }));
        expect(imported.feedbacks?.[0].nodeId).toBe("Functional-1:1");
    });
});
