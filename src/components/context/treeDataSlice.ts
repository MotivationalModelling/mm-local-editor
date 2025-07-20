import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs, createTreeDataFromTreeNode,
    createTreeIdsFromTreeData,
    Label,
    TabContent,
    TreeItem,
    TreeNode
} from "./FileProvider.tsx";
import {InitialTab, initialTabs} from "../../data/initialTabs.ts";

export const newTreeNode = ({goalId, children = []}: {
    goalId: TreeItem["id"],
    children?: TreeNode[]
}) => ({
    goalId,
    children
});

export const createTreeFromTreeData = (treeData: TreeItem[]): TreeNode[] => {
    return treeData.map((ti) => ({
        goalId: ti.id,
        children: createTreeFromTreeData(ti.children ?? [])
    }));
};

export const createTabContentFromInitialTab = ({label, icon, rows}: InitialTab): TabContent => ({
    label,
    icon,
    goalIds: rows.map((goal) => goal.id)
});

const createGoalsAndTabsFromTabContent = (initialTabs: InitialTab[]): {
    tabs: Map<Label, TabContent>,
    goals: Record<TreeItem["id"], TreeItem>
} => {
    const tabs: Map<Label, TabContent> = new Map(initialTabs.map((tab) => [tab.label, createTabContentFromInitialTab(tab)]));
    const allGoals = initialTabs.map((tab) => tab.rows).flat();
    const goals = Object.fromEntries(allGoals.map((goal) => [goal.id, goal]));

    return {goals, tabs};
};

export const removeItemIdFromTree = (items: TreeNode[], id: TreeNode["goalId"]): TreeNode[] => {
    return items.reduce((acc, item) => {
        if (item.goalId === id) {
            return acc; // Skip this item
        }
        if (item.children) {
            item.children = removeItemIdFromTree(item.children, id);
        }
        acc.push(item);
        return acc;
    }, [] as TreeNode[]);
};

export const removeItemIdFromTabs = (tabs: TabContent[], id: TreeItem["id"]): TabContent[] => {
    return tabs.map((tab) => ({
        ...tab,
        goalIds: tab.goalIds.filter((goalId) => (goalId !== id))
    }));
};

export const createInitialState = (tabData: InitialTab[] = initialTabs, treeData: TreeItem[] = []) => {
    console.log("tabData: ",tabData)
    console.log("treeData: ",treeData)
    const {goals, tabs} = createGoalsAndTabsFromTabContent(tabData);

    // console.log("createInitialState", tabContent, goals, tabs);
    return {
        tabs,
        goals,
        tree: createTreeFromTreeData(treeData),
        treeIds: createTreeIdsFromTreeData(treeData),
    };
};

export const treeDataSlice = createSlice({
    name: "treeData",
    initialState: {
        tree: [] as TreeNode[],
        tabs: {} as Map<Label, TabContent>,
        goals: {} as Record<TreeItem["id"], TreeItem>,
        treeIds: [] as TreeItem["id"][]
    },
    reducers: {
        // setTreeData: (state, action: PayloadAction<TreeItem[]>) => {
        //     state.treeData = action.payload;
        // },
        // setTabData: (state, action: PayloadAction<TabContent[]>) => {
        //     state.tabData = action.payload;
        // },
        addGoal(state, action: PayloadAction<TreeItem>) {
            state.goals[action.payload.id] = action.payload;
            state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
        },
        addGoalToTab: (state, action: PayloadAction<TreeItem>) => {
            state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
            state.goals[action.payload.id] = action.payload;
        },
        setTreeData: (state, action: PayloadAction<TreeItem[]>) => {
            state.tree = createTreeFromTreeData(action.payload);
        },
        addGoalToTree: (state, action: PayloadAction<TreeItem>) => {
            state.tree.push(newTreeNode({goalId: action.payload.id}));
            state.treeIds.push(action.payload.id);
        },
        deleteGoal: (state, action: PayloadAction<TreeItem>) => {
            const tabContent = state.tabs.get(action.payload.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.id);
            }
            state.tree = removeItemIdFromTree(state.tree, action.payload.id);
            state.treeIds = state.treeIds.filter((treeId) => treeId !== action.payload.id);
            delete state.goals[action.payload.id];
        },
        updateTextForGoalId: (state, action: PayloadAction<{
            id: TreeItem["id"],
            text: string
        }>) => {
            state.goals[action.payload.id] = {
                ...state.goals[action.payload.id],
                content: action.payload.text
            };
        },
        reset: (state, action: PayloadAction<{
            tabData: InitialTab[],
            treeData: TreeItem[]
        } | undefined>) => {
            const initialState = (action.payload) ? createInitialState(action.payload.tabData, action.payload.treeData)
                : createInitialState(initialTabs, []);
            Object.assign(state, initialState);
        },
        loadFromFile: (state, action: PayloadAction<any>) => {
            const fileContent = action.payload;
            if (!fileContent) return;

            let { tabData, treeData } = fileContent;
            if (tabData && tabData.length > 0 && tabData[0].goalIds) {
                const allGoals: Record<number, TreeItem> = {};
                (treeData || []).forEach((goal: TreeItem) => {
                    allGoals[goal.id] = goal;
                    const addChildren = (children?: TreeItem[]) => {
                        (children || []).forEach((child: TreeItem) => {
                            allGoals[child.id] = child;
                            addChildren(child.children);
                        });
                    };
                    addChildren(goal.children);
                });
                tabData = tabData.map((tab: any) => ({
                    label: tab.label,
                    icon: tab.icon,
                    rows: (tab.goalIds || []).map((id: number) => allGoals[id]).filter(Boolean),
                }));
            }
            const initialState = createInitialState(tabData || initialTabs, treeData || []);
            Object.assign(state, initialState);
        }
    },
    extraReducers: (builder) => {
        // XXX after every action, update copy in localstorage
        builder
            .addMatcher(() => true, (state) => {
                // onChange.?(state)
            })
    },
    selectors: {
        selectTabData: (state) => createTabDataFromTabs(state.goals, state.tabs),
        selectTreeData: (state) => createTreeDataFromTreeNode(state.goals, state.tree),
        selectGoalsForLabel: (state, label: Label) => state.tabs.get(label)?.goalIds.map((goalId) => state.goals[goalId]) ?? []
    }
});

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoal, updateTextForGoalId, reset, loadFromFile} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

