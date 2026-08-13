import {InitialTab, createDefaultTabData, defaultTreeData} from "../../data/initialTabs";
import {TabContent, TreeGoal} from "../types";

// A saved model in the local project store.
export type Project = {
    id: string;
    name: string;
    treeData: TreeGoal[];
    tabData: InitialTab[];
    createdAt: number;
    updatedAt: number;
};

// Soft accent colors for the placeholder card thumbnail, cycled by index.
const ACCENT_COLORS = [
    "#25213E",
    "#5C45C2",
    "#6B51C9",
    "#74A76C",
    "#8C86A7",
    "#45423D",
];

export const newProjectId = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// "Untitled", then "Untitled 1", "Untitled 2", ... avoiding collisions.
export const defaultProjectName = (existingNames: string[]): string => {
    if (!existingNames.includes("Untitled")) {
        return "Untitled";
    }
    let i = 1;
    while (existingNames.includes(`Untitled ${i}`)) {
        i += 1;
    }
    return `Untitled ${i}`;
};

export const cardAccentColor = (index: number): string =>
    ACCENT_COLORS[index % ACCENT_COLORS.length];

// Total number of goals across the tree, including nested children.
export const countGoals = (treeData: TreeGoal[]): number => {
    const countNodes = (nodes: TreeGoal[]): number =>
        nodes.reduce((sum, node) => sum + 1 + countNodes(node.children ?? []), 0);
    return countNodes(treeData);
};

export const formatRelativeTime = (timestamp: number): string => {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) {
        return "just now";
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days}d ago`;
    }
    return new Date(timestamp).toLocaleDateString(undefined, {month: "short", day: "numeric"});
};

// Rehydrate the file format (TabContent[] holding goal ids) into the in-app
// shape (InitialTab[] holding full goal rows) that reset() expects.
export const convertTabContentToInitialTab = (
    tabData: TabContent[],
    treeData: TreeGoal[]
): InitialTab[] => {
    const allGoals: Record<number, TreeGoal> = {};
    const collect = (goals: TreeGoal[]): void => {
        goals.forEach((goal) => {
            allGoals[goal.id] = goal;
            collect(goal.children ?? []);
        });
    };
    collect(treeData);
    return (tabData || []).map((tab) => ({
        label: tab.label,
        icon: tab.icon,
        rows: (tab.goalIds || []).map((id) => allGoals[id]).filter(Boolean),
    }));
};

// Default tree + tabs used for a freshly created project.
export const newProjectData = (): {treeData: TreeGoal[]; tabData: InitialTab[]} => ({
    treeData: defaultTreeData,
    tabData: createDefaultTabData(),
});
