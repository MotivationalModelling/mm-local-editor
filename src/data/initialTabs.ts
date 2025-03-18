import {Label, TreeItem} from "../components/context/FileProvider.tsx";

import WhoIcon from "/img/Stakeholder.png";
import DoIcon from "/img/Function.png";
import BeIcon from "/img/Cloud.png";
import FeelIcon from "/img/Heart.png";
import ConcernIcon from "/img/Risk.png";

export interface InitialTab {
    label: Label
    icon: string
    rows: TreeItem[]
}

// TODO: this is a duplicate copy of this function to avoid a circular import -- fix this!!
const newTreeItem = (initFields: Pick<TreeItem, "type"> & Partial<TreeItem>): TreeItem => ({
    content: "",
    id: initFields.id ?? Date.now(),
    ...initFields
});

// Define the initial tabs with labels and corresponding icons
// Note that the order here defines the order that the tabs appear
export const initialTabs: InitialTab[] = [
    {label: "Do", icon: DoIcon, rows: [newTreeItem({id: -1, type: "Do"})]},
    {label: "Be", icon: BeIcon, rows: [newTreeItem({id: -2, type: "Be"})]},
    {label: "Feel", icon: FeelIcon, rows: [newTreeItem({id: -3, type: "Feel"})]},
    {label: "Concern", icon: ConcernIcon, rows: [newTreeItem({id: -4, type: "Concern"})]},
    {label: "Who", icon: WhoIcon, rows: [newTreeItem({id: -5, type: "Who"})]},
];