import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'

import type {RootState} from '../../app/store'
import {Goal, GoalType} from "../types.ts";
import {TabContent, tabs, TreeItem} from "../context/FileProvider.tsx";

// Define a type for the slice state
interface TreeState {
    tabData: TabContent[],
    treeData: TreeItem[]
}

// Define the initial state using that type
const initialState: TreeState = {
    tabData: tabs,
    // tabData: tabs.map((tab, index) => ({
    //     ...tab,
    //     rows: [
    //         ...tab.rows,
    //         {
    //             id: Date.now() + index,
    //             type: tab.label,
    //             content: "",
    //         }
    //     ]
    // })),
    treeData: []
};


const removeItemIdFromTree = (items: TreeItem[], id: TreeItem["id"]): TreeItem[] => {
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

const removeItemIdFromTabs = (tabs: TabContent[], id: TreeItem["id"]): TabContent[] => {
    return tabs.map((tab) => ({
        ...tab,
        rows: tab.rows.filter((row) => (row.id !== id))
    }));
};

export const treeSlice = createSlice({
    name: 'tree',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setTree: (state, action: PayloadAction<TreeItem[]>) => {
            state.treeData = action.payload;
        },
        addGoalWithType: (state, action: PayloadAction<{goalType: GoalType, goal: Goal}>) => {
            state.treeData[action.payload.goalType].payload = action.payload.goal;
        },
        deleteGoalWithId: (state, action: PayloadAction<TreeItem["id"]>) => {
            state.treeData = removeItemIdFromTree(state.treeData, action.payload);
            state.tabData = removeItemIdFromTabs(state.tabData, action.payload);
        },
        reset: (state) => {
            state.treeData = [];
            state.tabData = tabs;
        },
    }
});

export const {setTree, addGoalWithType, deleteGoalWithId, reset} = treeSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectTree = (state: RootState) => state.tree;

export default treeSlice.reducer;