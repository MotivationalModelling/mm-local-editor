/**
* @jest-environment jsdom
*/
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import Home from "./Home";
import FileProvider from "./context/FileProvider";
import {FeedbackProvider} from "./context/FeedbackContext";
import {ProfileProvider} from "./context/ProfileContext";
import {ProjectProvider} from "./context/ProjectProvider";
import type {Project} from "./utils/projects";
import {decodeSharedModelHash} from "./utils/shareModel";

vi.mock("./header/ExportFileButton", () => ({default: () => null}));

const renderHome = () => {
    render(
        <MemoryRouter>
            <ProfileProvider>
                <ProjectProvider>
                    <FeedbackProvider><FileProvider>
                            <Home/>
                    </FileProvider></FeedbackProvider>
                </ProjectProvider>
            </ProfileProvider>
        </MemoryRouter>
    );
};

const sampleProject: Project = {
    id: "p1",
    name: "My Model",
    treeData: [],
    tabData: [],
    createdAt: 1000,
    updatedAt: Date.now(),
};

const storedProjects = () => JSON.parse(localStorage.getItem("ammber/projects") ?? "[]");

describe("Home", () => {
    afterEach(cleanup);

    beforeEach(() => {
        localStorage.clear();
    });

    it("shows the empty state", () => {
        renderHome();
        expect(screen.getByRole("heading", {name: "Projects"})).toBeTruthy();
        expect(screen.getByText(/Create a project or import a model/)).toBeTruthy();
    });

    it("renders saved projects", () => {
        localStorage.setItem("ammber/projects", JSON.stringify([sampleProject]));
        renderHome();
        expect(screen.getByText("My Model")).toBeTruthy();
        expect(screen.getByText(/0 goals/)).toBeTruthy();
    });

    it("creates a new project on New project click", () => {
        renderHome();
        fireEvent.click(screen.getByText("New project"));
        expect(storedProjects()).toHaveLength(1);
        expect(storedProjects()[0].name).toBe("Untitled");
    });

    it("renames a project from the card menu", async () => {
        localStorage.setItem("ammber/projects", JSON.stringify([sampleProject]));
        renderHome();
        fireEvent.click(screen.getByLabelText("Options for My Model"));
        fireEvent.click(screen.getByText("Rename"));
        const input = await screen.findByDisplayValue("My Model");
        fireEvent.change(input, {target: {value: "Renamed"}});
        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        await waitFor(() => expect(storedProjects()[0].name).toBe("Renamed"));
    });

    it("opens the share dialog from the card menu with image exports", async () => {
        localStorage.setItem("ammber/projects", JSON.stringify([sampleProject]));
        renderHome();
        fireEvent.click(screen.getByLabelText("Options for My Model"));
        fireEvent.click(screen.getByText("Share"));

        expect(
            await screen.findByText(/Anyone with the link can open a copy of this model/i)
        ).toBeTruthy();
        expect(screen.getByLabelText("Share link")).toBeTruthy();

        expect(screen.getByRole("button", {name: /Export/i})).toBeTruthy();
    });

    it("creates a share link for the selected project when multiple cards are shown", async () => {
        const otherGoal = {id: 9, content: "Other model goal", type: "Do" as const,
            instanceId: "9:1" as const, children: []};
        const otherProject: Project = {
            ...sampleProject,
            id: "p2",
            name: "Other Model",
            treeData: [otherGoal],
            tabData: ["Do", "Be", "Feel", "Concern", "Who"].map((label) => ({
                label, icon: "", rows: label === "Do" ? [otherGoal] : [],
            })) as Project["tabData"],
            updatedAt: sampleProject.updatedAt + 1,
        };
        localStorage.setItem(
            "ammber/projects",
            JSON.stringify([sampleProject, otherProject])
        );
        renderHome();

        fireEvent.click(screen.getByLabelText("Options for Other Model"));
        fireEvent.click(screen.getByText("Share"));

        const input = await screen.findByLabelText("Share link") as HTMLInputElement;
        const sharedModel = decodeSharedModelHash(new URL(input.value).hash);
        expect(sharedModel?.treeData[0].content).toBe("Other model goal");
    });

    it("uses a clear destructive action in the delete dialog", () => {
        localStorage.setItem("ammber/projects", JSON.stringify([sampleProject]));
        renderHome();
        fireEvent.click(screen.getByLabelText("Options for My Model"));
        fireEvent.click(screen.getByText("Delete"));
        expect(screen.getByRole("button", {name: "Delete project"})).toBeTruthy();
    });

    it("filters projects by search query", () => {
        localStorage.setItem(
            "ammber/projects",
            JSON.stringify([sampleProject, {...sampleProject, id: "p2", name: "Other"}])
        );
        renderHome();
        fireEvent.change(screen.getByLabelText("Search projects"), {target: {value: "my"}});
        expect(screen.getByText("My Model")).toBeTruthy();
        expect(screen.queryByText("Other")).toBeNull();
    });

    it("imports a JSON file as a project", async () => {
        renderHome();
        // jsdom File lacks .text(), so use an object with the same shape.
        const file = {
            name: "model.json",
            type: "application/json",
            text: async () => JSON.stringify({
                tabData: ["Do", "Be", "Feel", "Concern", "Who"].map((label) => ({
                    label, icon: "", goalIds: [],
                })),
                treeData: [],
            }),
        } as unknown as File;
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, {target: {files: [file]}});
        await waitFor(() => expect(storedProjects()).toHaveLength(1));
    });
});
