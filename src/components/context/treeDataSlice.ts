import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs,
    createTreeDataFromTreeNode,
    createTreeIdsFromTreeData,
    Label,
    TabContent,
    TreeItem,
    TreeNode
} from "./FileProvider.tsx";
import {InitialTab, initialTabs} from "../../data/initialTabs.ts";
import {parseInstanceId} from "../utils/GraphUtils.tsx";



export const newTreeNode = (
    treeIds: Record<TreeItem["id"], TreeItem["instanceId"][]>,
  {
    goalId,
    instanceId = generateInstanceId(treeIds, goalId),
    children = [],
  }: {
    goalId: TreeItem["id"];
    instanceId?: TreeItem["instanceId"];
    children?: TreeNode[];
  },
) => {
  // Update treeIds mapping
  if (treeIds[goalId]) {
    treeIds[goalId].push(instanceId);
  } else {
    treeIds[goalId] = [instanceId];
  }

  return {
    goalId,
    instanceId,
    children,
  };
};


export const createTreeFromTreeData = (
    treeData: TreeItem[],
): TreeNode[] => {
    return treeData.map((ti) => ({
        goalId: ti.id,
        // if ti.instanceId exists, use it, else compute one
        instanceId: ti.instanceId,
        children: createTreeFromTreeData(ti.children ?? []),
        color: ti.color
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

// remove each item from tree
export const removeItemIdFromTree = (
    items: TreeNode[],
    id: TreeNode["goalId"],
    instanceId?: TreeNode["instanceId"],
    removeChildren: boolean = true
): TreeNode[] => {
    return items.reduce((acc, item) => {
        if (item.goalId === id && item.instanceId === instanceId) {

            if (!removeChildren && item.children) {
                // Promote children to parent level
                acc.push(...item.children);
            }
            return acc; // skip this item
        }

        if (item.children) {
            item.children = removeItemIdFromTree(item.children, id, instanceId, removeChildren);
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

const removeAllReferenceFromHierarchy = (
    tree: TreeNode[],
    goalId: TreeItem["id"],
    instanceId?: TreeItem["instanceId"],
): TreeNode[] => {
    return tree
        .filter(node => {
            if (instanceId !== undefined) {
                // keep nodes that are not this specific instance
                return !(node.goalId === goalId && node.instanceId === instanceId);
            } else {
                // keep nodes that do not match the goalId
                return node.goalId !== goalId;
            }
        })
        .map(node => ({
            ...node,
            children: node.children
                ? removeAllReferenceFromHierarchy(node.children, goalId, instanceId)
                : []
        }));
};

const generateMaxSuffix = (treeIds: Record<TreeItem["id"], TreeItem["instanceId"][]>, goalId: TreeItem["id"]): number => {
    const ids = treeIds[goalId]?.filter((id): id is string => id != null);  // filter out undefined & null
    if (!ids || ids.length === 0) return 0;
    return Math.max(
        ...ids.map((id) => parseInstanceId(id).refId)
    );
};


const generateInstanceId = (treeIds: Record<TreeItem["id"], TreeItem["instanceId"][]>, goalId: TreeItem["id"]): TreeItem["instanceId"] => {
    // give it new instance id
    const maxSuffix = generateMaxSuffix(treeIds, goalId) + 1;
    return `${goalId}-${maxSuffix}`
};

//
export const createInitialState = (tabData: InitialTab[] = initialTabs, treeData: TreeItem[] = []) => {

    const {goals, tabs} = createGoalsAndTabsFromTabContent(tabData);

    // console.log("createInitialState", tabContent, goals, tabs);
    return {
        tabs,
        goals,
        tree: createTreeFromTreeData(treeData),
        treeIds: createTreeIdsFromTreeData(treeData),
    };
};

const updateTreeNodeColor = (nodes: TreeNode[], goalId: number, instanceId: string, color: string) => {
    nodes.forEach((node) => {
        if (node.goalId === goalId && node.instanceId === instanceId) {
            node.color = color;
            return;
        }
        if (node.children) {
            updateTreeNodeColor(node.children, goalId, instanceId, color);
        }
    });
}

export const treeDataSlice = createSlice({
    name: "treeData",
    initialState: {
        tree: [] as TreeNode[],
        tabs: {} as Map<Label, TabContent>,
        goals: {} as Record<TreeItem["id"], TreeItem>,
        treeIds: {} as Record<TreeItem["id"], TreeItem["instanceId"][]>
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
            const node = newTreeNode(state.treeIds,{goalId: action.payload.id});
            state.tree.push(node);
        },
        // remove goal(s) and its children from canvas
        removeGoalIdFromTree: (state, action: PayloadAction<{
            id: TreeItem["id"],
            instanceId: TreeItem["instanceId"]
            removeChildren: boolean
        }>) => {
            state.tree = removeItemIdFromTree(state.tree, action.payload.id, action.payload.instanceId, action.payload.removeChildren);
            // state.treeIds = createTreeIdsFromTreeNode(state.tree);
        },
        // delete it will also delete the reference in the tree
        deleteGoalFromGoalList: (state, action: PayloadAction<{
            item: TreeItem
        }>) => {
            const tabContent = state.tabs.get(action.payload.item.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.item.id);
            }
            delete state.goals[action.payload.item.id];
            // remove it and its reference
            state.tree = removeAllReferenceFromHierarchy(state.tree, action.payload.item.id, undefined)
            delete state.treeIds[action.payload.item.id];
        },
        // delete it will not affect the orginal and other reference
        deleteGoalReferenceFromHierarchy: (state, action: PayloadAction<{
            item: TreeItem
        }>) => {
            // only itself
            state.tree = removeAllReferenceFromHierarchy(state.tree, action.payload.item.id, action.payload.item.instanceId)
            state.treeIds[action.payload.item.id] = state.treeIds[action.payload.item.id].filter(node => node !== action.payload.item.instanceId);
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
        updateTextForInstanceId: (state, action: PayloadAction<{
            instanceId: string,
            text: string
        }>) => {
            const {instanceId, text} = action.payload;
            const goalId = parseInstanceId(instanceId).goalId;
            state.goals[goalId] = {
                ...state.goals[goalId],
                content: text
            };
        },
        updateColorForInstanceId: (state, action: PayloadAction<{
            instanceId: string,
            color: string
        }>) => {
            const {instanceId, color} = action.payload;
            const goalId = parseInstanceId(instanceId).goalId;
            updateTreeNodeColor(state.tree, goalId, instanceId, color);
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

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoalReferenceFromHierarchy, deleteGoalFromGoalList, updateTextForGoalId, reset, removeGoalIdFromTree, updateTextForInstanceId, updateColorForInstanceId} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

