import {useMemo, useReducer} from "react";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Label, TreeItem} from "../components/context/FileProvider.tsx";
import {InitialTab, initialTabs} from "../data/initialTabs.ts";

// This hook manages the goals that are in use in the motivational model.
//
// The goals are made available to the app using two separate views of the
// goals themselves: one is a list of goals organised by type, the other is
// a tree of goals which the user has organised. Note that the goals
// organised by type contains all the goals; the tree may only contain some
// of the goals which the user has added to the hierarchy.
//
// To do this, we have a set of goals and then two data structures -- tabs and
// tree -- which just hold goal ids.
//
// Previously the code to manage and update these data structures was all done
// in-line and it was very hard to maintain and harder to test.

export interface TreeNode {
    goalId: TreeItem["id"]
    children?: TreeNode[]
}

const newTreeNode = ({goalId, children = []}: {goalId: TreeItem["id"], children?: TreeNode[]}) => ({
    goalId,
    children
});

export type TabContent = {
  label: Label
  icon: string
  goalIds: TreeItem["id"][]
};

export const removeItemIdFromTree = (items: TreeNode[], id: TreeItem["id"]): TreeNode[] => {
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

const createTreeFromTreeData = (treeData: TreeItem[]): TreeNode[] => {
    return treeData.map((ti) => ({
        goalId: ti.id,
        children: createTreeFromTreeData(ti.children ?? [])
    }));
};

// XXX this should be a Set
export const createTreeIdsFromTreeData = (treeData: TreeItem[]): TreeItem["id"][] => {
    const treeIds = treeData.map((td) => [
            td.id,
            ...createTreeIdsFromTreeData(td.children ?? [])
        ]
    ).flat();
    return treeIds;
};

const createTabContentFromInitialTab = ({label, icon, rows}: InitialTab): TabContent => ({
    label,
    icon,
    goalIds: rows.map((goal) => goal.id)
});

const createGoalsAndTabsFromTabContent = (initialTabs: InitialTab[]): {tabs: Map<Label, TabContent>, goals: Record<TreeItem["id"], TreeItem>} => {
    const tabs: Map<Label, TabContent> = new Map(initialTabs.map((tab) => [tab.label, createTabContentFromInitialTab(tab)]));
    const allGoals = initialTabs.map((tab) => tab.rows).flat();
    const goals = Object.fromEntries(allGoals.map((goal) => [goal.id, goal]));

    return {goals, tabs};
};

// Note: we are using a Map here for the tabs because it preserves the order that the
// items were added in.

const createTreeDataSlice = () => {
    return createSlice({
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
            addGoal: (state, action: PayloadAction<TreeItem>) => {
                state.goals[action.payload.id] = action.payload;
                state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
            },
            addGoalToTab: (state, action: PayloadAction<TreeItem>) => {
                state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
                state.goals[action.payload.id] = action.payload;
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
            updateTextForGoalId: (state, action: PayloadAction<{id: TreeItem["id"], text: string            }>) => {
                state.goals[action.payload.id] = {
                    ...state.goals[action.payload.id],
                    content: action.payload.text
                };
            },
            reset: (state, action: PayloadAction<{tabContent: InitialTab[], treeData: TreeItem[]} | undefined>) => {
                const initialState = (action.payload) ? createInitialState(action.payload.tabContent, action.payload.treeData)
                                                      : createInitialState(initialTabs, []);
                Object.assign(state, initialState);
            }
        },
        extraReducers: (builder) => {
            // XXX after every action, update copy in localstorage
            builder
                .addMatcher(() => true, (state) => {
                    // TODO update localStorage
                })
        }
    })
};


const createInitialState = (tabContent: InitialTab[] = initialTabs, treeData: TreeItem[] = []) => {
    const {goals, tabs} = createGoalsAndTabsFromTabContent(tabContent);

    return {
        tabs,
        goals,
        tree: createTreeFromTreeData(treeData),
        treeIds: createTreeIdsFromTreeData(treeData),
    };
};


function useTreeData(tabContent: InitialTab[] = initialTabs, treeData: TreeItem[] = []) {
    const treeDataSlice = useMemo(() => createTreeDataSlice(), []);
    const initialState = createInitialState(tabContent, treeData);
    const [state, dispatch] = useReducer(treeDataSlice.reducer, initialState);

    return {
        ...state,
        ...treeDataSlice.actions,
        dispatch,
        goalsForLabel: (label: Label) => state.tabs.get(label)?.goalIds.map((goalId) => state.goals[goalId]) ?? []
    } as const;
}

export type UseTreeData = ReturnType<typeof useTreeData>;

export default useTreeData;