import { Label,newTreeItem,TreeItem } from "./dataModels.ts";

import BeIcon from "/img/Cloud.png";
import DoIcon from "/img/Function.png";
import FeelIcon from "/img/Heart.png";
import ConcernIcon from "/img/Risk.png";
import WhoIcon from "/img/Stakeholder.png";

export interface InitialTab {
    label: Label
    icon: string
    rows: TreeItem[]
}

// Predefined constant cluster to use for the example graph
export const defaultTreeData: TreeItem[] = [{
    id: 1,
    content: "Do",
    type: "Do",
    instanceId: "1-1",
    children: [{
        id: 6,
        content: "Do1",
        type: "Do",
        instanceId: "6-1",
        children: [{
            id: 7,
            content: "Do2",
            type: "Do",
            instanceId: "7-1",
            children: []
        }]
    }, {
        id: 8,
        content: "Do3",
        type: "Do",
        instanceId: "8-1",
        children: []
    }]
}, {
    id: 2,
    content: "Be",
    type: "Be",
    instanceId: "2-1",
    children: []
}, {
    id: 3,
    content: "Feel",
    type: "Feel",
    instanceId: "3-1",
    children: []
}, {
    id: 4,
    content: "Who",
    type: "Who",
    instanceId: "4-1",
    children: []
}, {
    id: 5,
    content: "Concern",
    type: "Concern",
    instanceId: "5-1",
    children: []
}];

// Function to create default tab data from default tree data
export const createDefaultTabData = (): InitialTab[] => {
    // Group goals by type
    const goalsByType: Record<Label, TreeItem[]> = {
        "Do": [],
        "Be": [],
        "Feel": [],
        "Who": [],
        "Concern": []
    };

    // Helper function to collect all goals from tree data
    const collectGoals = (items: TreeItem[]) => {
        items.forEach(item => {
            goalsByType[item.type].push(item);
            if (item.children && item.children.length > 0) {
                collectGoals(item.children);
            }
        });
    };

    collectGoals(defaultTreeData);

    return [
        {label: "Do", icon: DoIcon, rows: goalsByType["Do"]},
        {label: "Be", icon: BeIcon, rows: goalsByType["Be"]},
        {label: "Feel", icon: FeelIcon, rows: goalsByType["Feel"]},
        {label: "Concern", icon: ConcernIcon, rows: goalsByType["Concern"]},
        {label: "Who", icon: WhoIcon, rows: goalsByType["Who"]},
    ];
};

// Define the initial tabs with labels and corresponding icons
// Note that the order here defines the order that the tabs appear
export const initialTabs: InitialTab[] = [
    {label: "Do", icon: DoIcon, rows: [newTreeItem({id: -1, type: "Do"})]},
    {label: "Be", icon: BeIcon, rows: [newTreeItem({id: -2, type: "Be"})]},
    {label: "Feel", icon: FeelIcon, rows: [newTreeItem({id: -3, type: "Feel"})]},
    {label: "Concern", icon: ConcernIcon, rows: [newTreeItem({id: -4, type: "Concern"})]},
    {label: "Who", icon: WhoIcon, rows: [newTreeItem({id: -5, type: "Who"})]},
];