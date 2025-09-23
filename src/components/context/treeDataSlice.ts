import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs,
    createTreeDataFromTreeNode,
    createTreeIdsFromTreeData, createTreeIdsFromTreeNode,
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

// return the reduced Treenode
export const removeItemIdFromTree = (
  items: TreeNode[],
  id: TreeNode["goalId"],
  removeChildren: boolean=true
): TreeNode[] => {
  return items.reduce((acc, item) => {

    console.log("removeCellRecursively: item.goalID ",item.goalId)
    console.log("removeCellRecursively: id ",id)
    if (item.goalId === id) {
        console.log("removeCellRecursively: item ",item)
      if (!removeChildren && item.children) {
        // Promote children to parent level
        acc.push(...item.children);
      }
      return acc; // skip this item
    }

    if (item.children) {
      item.children = removeItemIdFromTree(item.children, id, removeChildren);
    }
    
    acc.push(item);
    console.log("removeCellRecursively: acc ",acc)
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
            console.log("！！！addGoal: action.payload ",action.payload)
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
            console.log("！！！addGoalToTree: action.payload ",action.payload)
            state.tree.push(newTreeNode({goalId: action.payload.id}));
            state.treeIds.push(action.payload.id);
            console.log("！！！addGoalToTree:treeIds ",state.treeIds.slice())
        },
        // remove goal(s) and its children from hierachy
        removeGoalIdFromTree: (state, action: PayloadAction<{
            id: TreeItem["id"],
            removeChildren: boolean
        }>) => {
            state.tree = removeItemIdFromTree(state.tree, action.payload.id, action.payload.removeChildren);
            state.treeIds = createTreeIdsFromTreeNode(state.tree);
        },
        deleteGoal: (state, action: PayloadAction<TreeItem>) => {
            const tabContent = state.tabs.get(action.payload.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.id);
            }
            // reassign the value
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

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoal, updateTextForGoalId, reset, removeGoalIdFromTree} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

