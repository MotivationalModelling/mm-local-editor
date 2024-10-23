import DoIcon from "*.png";
import BeIcon from "*.png";
import FeelIcon from "*.png";
import ConcernIcon from "*.png";
import WhoIcon from "*.png";
import {Label, newTreeItem, TreeItem} from "../components/context/FileProvider.tsx";

export interface InitialTab {
    label: Label
    icon: string
    rows: TreeItem[]
}

// Define the initial tabs with labels and corresponding icons
export const initialTabs: InitialTab[] = [
    {label: "Do", icon: DoIcon, rows: [newTreeItem({id: -1, type: "Do"})]},
    {label: "Be", icon: BeIcon, rows: [newTreeItem({id: -2, type: "Be"})]},
    {label: "Feel", icon: FeelIcon, rows: [newTreeItem({id: -3, type: "Feel"})]},
    {label: "Concern", icon: ConcernIcon, rows: [newTreeItem({id: -4, type: "Concern"})]},
    {label: "Who", icon: WhoIcon, rows: [newTreeItem({id: -5, type: "Who"})]},
];