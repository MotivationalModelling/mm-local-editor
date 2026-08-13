import {describe, expect, it} from "vitest";
import {
    cardAccentColor,
    countGoals,
    convertTabContentToInitialTab,
    defaultProjectName,
    formatRelativeTime,
    newProjectData,
    newProjectId,
} from "./projects";
import {Label, TabContent, newTreeGoal} from "../types";

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

describe("cardAccentColor", () => {
    it("cycles colors by index", () => {
        expect(cardAccentColor(0)).toBe(cardAccentColor(6));
        expect(cardAccentColor(1)).not.toBe(cardAccentColor(0));
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

describe("convertTabContentToInitialTab", () => {
    it("rehydrates goal ids into goal rows", () => {
        const tree = [newTreeGoal({id: 1, type: "Do", content: "A"})];
        const tabs: TabContent[] = [{label: "Do" as Label, icon: "icon", goalIds: [1]}];
        const result = convertTabContentToInitialTab(tabs, tree);
        expect(result[0].rows[0].content).toBe("A");
    });
});
