/**
 * @vitest-environment jsdom
 */
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import ShareModal from "./ShareModal";
import FileProvider from "./context/FileProvider";
import {FeedbackProvider} from "./context/FeedbackContext";
import {ProfileProvider} from "./context/ProfileContext";
import {ProjectProvider} from "./context/ProjectProvider";
import type {Project} from "./utils/projects";

vi.mock("./header/ExportFileButton", () => ({default: () => null}));

const renderShare = (model: Project) => render(
    <ProfileProvider><ProjectProvider><FeedbackProvider><FileProvider>
        <ShareModal show project={model} showGraphSection={false} onHide={vi.fn()}/>
    </FileProvider></FeedbackProvider></ProjectProvider></ProfileProvider>
);

const goal = {
    id: 1,
    content: "Share this goal",
    type: "Do" as const,
    instanceId: "1:1" as const,
    children: [],
};

const project: Project = {
    id: "project-id",
    name: "Shareable model",
    treeData: [goal],
    tabData: [{label: "Do", icon: "", rows: [goal]}],
    feedbacks: [],
    createdAt: 1,
    updatedAt: 2,
};

const pseudoRandomText = (length: number): string => {
    let seed = 123456789;
    return Array.from({length}, () => {
        seed = (seed * 16807) % 2147483647;
        return String.fromCharCode(32 + (seed % 95));
    }).join("");
};

describe("ShareModal", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("shows a copyable link and QR code as soon as it opens", () => {
        renderShare(project);

        const input = screen.getByLabelText("Share link") as HTMLInputElement;
        expect(input.value).toContain("#share=");

        expect(screen.getByRole("button", {name: /copy link/i})).toBeTruthy();
        expect(screen.getByTestId("share-qr")).toBeTruthy();
        expect(
            screen.getByText(/Anyone with the link can open a copy of this model/i)
        ).toBeTruthy();
    });

    it("shows an error instead of rendering an oversized QR code", () => {
        const oversizedGoal = {
            ...goal,
            content: pseudoRandomText(12_000),
        };
        const oversizedProject: Project = {
            ...project,
            treeData: [oversizedGoal],
            tabData: [{label: "Do", icon: "", rows: [oversizedGoal]}],
        };

        renderShare(oversizedProject);

        expect(screen.getByText(/too large/i)).toBeTruthy();
        expect(screen.queryByTestId("share-qr")).toBeNull();
        expect(screen.queryByLabelText("Share link")).toBeNull();
    });
});
