import {describe, expect, it} from "vitest";
import {createDefaultTabData, defaultTreeData} from "../../data/initialTabs";
import type {JSONData} from "../modelJson";
import {renderProjectImageSvg} from "./projectImage";

const model: JSONData = {
    tabData: createDefaultTabData().map((tab) => ({
        label: tab.label, icon: tab.icon, goalIds: tab.rows.map((goal) => goal.id),
    })),
    treeData: defaultTreeData,
    overallFeedback: {author: "Team", content: "Overall review content", updatedAt: "2026-09-28"},
    feedbacks: [{
        id: "one", nodeId: "Functional-6:1", nodeLabel: "Do1", author: "Team",
        content: "Goal comment content", createdAt: "now", status: "open",
    }],
};

describe("project image", () => {
    it("shows the model in a card preview and includes goal comments only when selected", () => {
        const preview = renderProjectImageSvg(model, false, false);
        expect(preview).toContain(">Do1</text>");
        expect(preview).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(preview).not.toContain("Overall review content");
        expect(preview).not.toContain("Goal comment content");

        const sharedImage = renderProjectImageSvg(model, true);
        expect(sharedImage).toContain("Overall review content");
        expect(sharedImage).toContain("Goal comment content");
        expect(sharedImage).toContain('fill="#6847c9"');
    });
});
