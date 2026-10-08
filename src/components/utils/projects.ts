import {createDefaultTabData, defaultTreeData, type InitialTab} from "../../data/initialTabs";
import type {Feedback, OverallFeedback, TreeGoal} from "../types";

export type ProjectData = {
    treeData: TreeGoal[];
    tabData: InitialTab[];
    feedbacks?: Feedback[];
    overallFeedback?: OverallFeedback;
};

export type Project = ProjectData & {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
};

export const newProjectId = () => crypto.randomUUID();
export const newProjectData = (): ProjectData => ({
    treeData: structuredClone(defaultTreeData),
    tabData: createDefaultTabData(),
    feedbacks: [],
});
export const defaultProjectName = (names: string[]) => {
    let name = "Untitled";
    for (let index = 1; names.includes(name); index++) name = `Untitled ${index}`;
    return name;
};
export const uniqueProjectName = (base: string, names: string[]) => {
    let name = base;
    for (let index = 2; names.includes(name); index++) name = `${base} (${index})`;
    return name;
};
export const countGoals = (goals: TreeGoal[]): number =>
    goals.reduce((count, goal) => count + 1 + countGoals(goal.children ?? []), 0);
export const formatRelativeTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
};
