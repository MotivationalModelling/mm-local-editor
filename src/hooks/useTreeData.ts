import {useMemo, useReducer} from "react";
import {createSlice, PayloadAction, UnknownAction} from "@reduxjs/toolkit";
import {
    initialTabs,
    TabContent,
    TreeItem
} from "../components/context/FileProvider.tsx";

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

const createTreeDataSlice = (tabContent: TabContent[]) => {
    return createSlice({
        name: "treeData",
        initialState: {
            tabData: tabContent,
            treeData: flattenTabContent(tabContent)
        },
        reducers: {
            setTreeData: (state, action: PayloadAction<TreeItem[]>) => {
                state.treeData = action.payload;
            },
            setTabData: (state, action: PayloadAction<TabContent[]>) => {
                state.tabData = action.payload;
            },
            addGoal: (state, action: PayloadAction<TreeItem>) => {
                state.treeData.push(action.payload);
            },
            addGoalToTab: (state, action: PayloadAction<TreeItem>) => {
                for (const tab of state.tabData) {
                    if (tab.label === action.payload.type) {
                        tab.rows.push(action.payload);
                    }
                }
                state.treeData.push(action.payload);
            },
            deleteGoalWithId: (state, action: PayloadAction<TreeItem["id"]>) => {
                state.treeData = removeItemIdFromTree(state.treeData, action.payload);
                state.tabData = removeItemIdFromTabs(state.tabData, action.payload);
            },
            updateTextForGoalId: (state, action: PayloadAction<{
                id: TreeItem["id"],
                text: string
            }>) => {
                for (const item of state.treeData) {
                    if (item.id === action.payload.id) {
                        item.content = action.payload.text;
                        break;
                    }
                }
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

function useTreeData(tabs: TabContent[] = initialTabs) {
    const selectionSlice = useMemo(() => createTreeDataSlice(tabs), [tabs]);
    const [state, dispatch] = useReducer(selectionSlice.reducer, {tabData: tabs, treeData: flattenTabContent(tabs)});
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
                Object.entries(selectionSlice.actions)
                    .map(([key, actionFn]) => [key, wrapInDispatch(actionFn)])
            ) as typeof selectionSlice.actions
        },
        [selectionSlice, dispatch]
    );

    return {...state, ...actions} as const;
}

export type UseTreeData = ReturnType<typeof useTreeData>;

export default useTreeData;