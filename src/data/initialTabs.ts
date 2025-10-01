import { Label, TreeItem,newTreeItem  } from "../components/context/FileProvider.tsx";

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

// //TODO: this is a duplicate copy of this function to avoid a circular import -- fix this!!
// const newTreeItem = (initFields: Pick<TreeItem, "type"> & Partial<TreeItem>): TreeItem => {
//     const id = initFields.id ?? Date.now();
//     const instanceID = initFields.instanceID ?? `${id}-${0}`;
//     return{
//         id: id,
//         content: "",
//         instanceID:instanceID,  // give 0 when it is empty
//         ...initFields
//     }
// };

// Predefined constant cluster to use for the example graph
export const defaultTreeData: TreeItem[] = [{
    id: 1,
    content: "Do",
    type: "Do",
    instanceID:"1-1",
    children: [{
        id: 6,
        content: "Do1",
        type: "Do",
        instanceID:"6-1",
        children: [{
            id: 7,
            content: "Do2",
            type: "Do",
            instanceID:"7-1",
            children: []
        }]
    }, {
        id: 8,
        content: "Do3",
        type: "Do",
        instanceID:"8-1",
        children: []
    }]
}, {
    id: 2,
    content: "Be",
    type: "Be",
    instanceID:"2-1",
    children: []
}, {
    id: 3,
    content: "Feel",
    type: "Feel",
    instanceID:"3-1",
    children: []
}, {
    id: 4,
    content: "Who",
    type: "Who",
    instanceID:"4-1",
    children: []
}, {
    id: 5,
    content: "Concern",
    type: "Concern",
    instanceID:"5-1",
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