import type {InitialTab} from "../../data/initialTabs";
import type {TabContent, TreeGoal} from "../types";

// The file format stores tab goal IDs; the editor reducer needs full rows.
export function convertTabContentToInitialTab(tabData: TabContent[], treeData: TreeGoal[]): InitialTab[] {
    const goals = new Map<number, TreeGoal>();
    const collect = (items: TreeGoal[]) => items.forEach((goal) => {
        goals.set(goal.id, goal);
        collect(goal.children ?? []);
    });
    collect(treeData);

    return tabData.map((tab) => ({
        label: tab.label,
        icon: tab.icon,
        rows: tab.goalIds.map((id) => goals.get(id)).filter((goal): goal is TreeGoal => goal !== undefined),
    }));
}
