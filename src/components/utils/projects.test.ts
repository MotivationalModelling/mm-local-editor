import {describe, expect, it} from "vitest";
import {
    countGoals,
    defaultProjectName,
    formatRelativeTime,
    uniqueProjectName,
    newProjectData,
    newProjectId,
} from "./projects";
import {newTreeGoal} from "../types";

describe("newProjectId", () => {
    it("returns a unique id each call", () => {
        expect(newProjectId()).not.toBe(newProjectId());
    });
});

describe("defaultProjectName", () => {
    it("returns Untitled when there is no collision", () => {
        expect(defaultProjectName(["Other"])).toBe("Untitled");
    });

    it("increments to avoid collisions", () => {
        expect(defaultProjectName(["Untitled", "Untitled 1"])).toBe("Untitled 2");
    });
});

describe("uniqueProjectName", () => {
    it("keeps the base name when there is no collision", () => {
        expect(uniqueProjectName("My Model", ["Other"])).toBe("My Model");
    });

    it("appends (2) when the name is taken", () => {
        expect(uniqueProjectName("My Model", ["My Model"])).toBe("My Model (2)");
    });

    it("reuses the first free suffix", () => {
        expect(
            uniqueProjectName("My Model", ["My Model", "My Model (2)"])
        ).toBe("My Model (3)");
    });

    it("keeps incrementing past existing suffixes", () => {
        expect(
            uniqueProjectName("My Model", [
                "My Model",
                "My Model (2)",
                "My Model (3)"
            ])
        ).toBe("My Model (4)");
    });
});

describe("countGoals", () => {
    it("counts nested goals", () => {
        const root = newTreeGoal({id: 1, type: "Do", content: "root"});
        root.children = [newTreeGoal({id: 2, type: "Do", content: "child"})];
        expect(countGoals([root])).toBe(2);
    });

    it("returns zero for an empty tree", () => {
        expect(countGoals([])).toBe(0);
    });
});

describe("formatRelativeTime", () => {
    it("shows just now for recent timestamps", () => {
        expect(formatRelativeTime(Date.now())).toBe("just now");
    });
});

describe("newProjectData", () => {
    it("provides non-empty default tree and tabs", () => {
        const data = newProjectData();
        expect(data.treeData.length).toBeGreaterThan(0);
        expect(data.tabData.length).toBeGreaterThan(0);
    });
});
