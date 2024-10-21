import {useMemo, useReducer} from "react";
import {createSlice, PayloadAction, UnknownAction} from "@reduxjs/toolkit";
import {
    initialTabs, Label,
    TabContent,
    TreeItem
} from "../components/context/FileProvider.tsx";

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

interface TreeNode {
    treeId: TreeItem["id"]
    children?: TreeNode[]
}

interface TabNode {
    type: Label
    treeIds: TreeItem["id"][]
}

export const removeItemIdFromTree = (items: TreeItem[], id: TreeItem["id"]): TreeItem[] => {
    return items.reduce((acc, item) => {
        if (item.id === id) {
            return acc; // Skip this item
        }
        if (item.children) {
            item.children = removeItemIdFromTree(item.children, id);
        }
        acc.push(item);
        return acc;
    }, [] as TreeItem[]);
};

export const removeItemIdFromTabs = (tabs: TabContent[], id: TreeItem["id"]): TabContent[] => {
    return tabs.map((tab) => ({
        ...tab,
        rows: tab.rows.filter((row) => (row.id !== id))
    }));
};
const flattenTabContent = (tabContent: TabContent[]): TreeItem[] => {
    return tabContent.map((tab) => tab.rows).flat();
};

const createTreeFromTreeData = (treeData: TreeItem[]): TreeNode[] => {
    return treeData.map((ti) => ({
        treeId: ti.id,
        children: createTreeFromTreeData(ti.children ?? [])
    }));
};

const createTabsFromTabContent = (tabContent: TabContent[]) => {
    const tabs: Record<Label, TreeItem["id"][]> = {
        Do: [],
        Be: [],
        Feel: [],
        Concern: [],
        Who: []
    };

    tabContent.forEach((tab) => {
        tabs[tab.label] = tab.rows.map((item) => item.id);
    });
    return tabs;
};

const createGoalsFromTabContent = (tabContent: TabContent[]) => {
    const goals: Record<TreeItem["id"], TreeItem> = {};

    tabContent.forEach((tab) => {
        tab.rows.forEach((goal) => {
            goals[goal.id] = goal;
        })
    });

    return goals;
};

const createTreeDataSlice = () => {
    return createSlice({
        name: "treeData",
        initialState: {
            tree: [] as TreeNode[],
            tabs: {} as Record<Label, TreeItem["id"][]>,
            goals: {} as Record<TreeItem["id"], TreeItem>
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
                state.tabs[action.payload.type].push(action.payload.id);
            },
            addGoalToTab: (state, action: PayloadAction<TreeItem>) => {
                state.tabs[action.payload.type].push(action.payload.id);
                state.goals[action.payload.id] = action.payload;
            },
            deleteGoal: (state, action: PayloadAction<TreeItem>) => {
                state.tabs[action.payload.type] = state.tabs[action.payload.type].filter((id) => id !== action.payload.id);
                state.tree = removeItemFromTree(state.tree, action.payload);
                delete state.goals[action.payload.id];
            },
            updateTextForGoalId: (state, action: PayloadAction<{id: TreeItem["id"], text: string            }>) => {
                state.goals[action.payload.id] = {
                    ...state.goals[action.payload.id],
                    content: action.payload.text
                };
            },
            reset: (state) => {
                state.tabData = tabContent;
                state.treeData = flattenTabContent(tabContent);
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


type AnyFunction = (...args: any[]) => UnknownAction;

function useTreeData(tabContent: TabContent[] = initialTabs, treeData: TreeItem[] = []) {
    const treeDataSlice = useMemo(() => createTreeDataSlice(), []);
    const initialState = {
        tree: createTreeFromTreeData(treeData),
        tabs: createTabsFromTabContent(tabContent),
        goals: createGoalsFromTabContent(tabContent)
    };
    const [state, dispatch] = useReducer(treeDataSlice.reducer, initialState);
    // wrap each of the slice actions in a call to dispatch so that the caller doesn't
    // need to do that manually
    // XXX While this works I think it's a bit clumsy and heavy-handed with types.
    const actions = useMemo(() => {
            const wrapInDispatch = <Func extends AnyFunction>(fn: Func,): ((...args: Parameters<Func>) => void) => {
                const wrappedFn = (...args: Parameters<Func>): void => {
                    dispatch(fn(...args));
                };
                return wrappedFn;
            };
            return Object.fromEntries(
                Object.entries(treeDataSlice.actions)
                    .map(([key, actionFn]) => [key, wrapInDispatch(actionFn)])
            ) as typeof treeDataSlice.actions
        },
        [treeDataSlice, dispatch]
    );

    return {
        ...state,
        ...actions,
        goalsForLabel: (label: Label) => state.tabs[label].map((goalId) => state.goals[goalId])
        // tabData: makeTabData(),
        // tree
    } as const;
}

export type UseTreeData = ReturnType<typeof useTreeData>;

export default useTreeData;