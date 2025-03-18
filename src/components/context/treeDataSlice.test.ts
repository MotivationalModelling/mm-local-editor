/**
* @jest-environment jsdom
*/
// Leave this (^) or you will see "ReferenceError: document is not defined" from renderHook

import {describe, it, expect, beforeEach, beforeAll} from "vitest";
import {
    addGoal,
    addGoalToTab, addGoalToTree,
    createInitialState,
    deleteGoal, reset, selectGoalsForLabel,
    treeDataSlice,
    updateTextForGoalId
} from "./treeDataSlice";
import {enableMapSet} from "immer";
import {initialTabs} from "../../data/initialTabs.ts";
import {newTreeItem, TreeItem} from "./FileProvider.tsx";

describe('useFileContext', () => {
    beforeAll(() => {
        enableMapSet();
    });
    let initialState: ReturnType<typeof createInitialState>;
    beforeEach(() => {
        initialState = createInitialState(initialTabs, []);
    });
    it('should start with five tabs', () => {
        expect(initialState.tabs.size).toEqual(5);
    });
    it('should add a goal', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.size).toEqual(5);
        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const newState = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(newState.tabs.get(goal.type)?.goalIds).toContain(goal.id);
    });
    it('removes a goal', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const state1 = treeDataSlice.reducer(initialState, addGoal(goal));

        expect(state1.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        const state2 = treeDataSlice.reducer(initialState, deleteGoal(goal));

        expect(state2.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('ignores removing an nx goal', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
        const state2 = treeDataSlice.reducer(initialState, deleteGoal(goal));
        expect(state2.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('should revert on reset', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const state1 = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(state1.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        const state2 = treeDataSlice.reducer(initialState, reset());

        expect(state2.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
        expect(state2.tabs.size).toEqual(5);
    });
    it('should update text of the goal', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);
        const state1 = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(state1.goals[goal.id].content).not.toEqual(text);

        const state2 = treeDataSlice.reducer(initialState, updateTextForGoalId({id: goal.id, text}));

        expect(state2.goals[goal.id].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.get(goal.type)?.goalIds).toHaveLength(1);

        const state = treeDataSlice.reducer(initialState, addGoalToTab(goal));

        // check added to tab
        expect(state.tabs.get(goal.type)?.goalIds).toHaveLength(2);
        // check added to correct tab
        expect(state.tabs.get(goal.type)?.goalIds).toContain(goal.id);
        // check added to goals
        expect(state.goals).toHaveProperty(String(goal.id));
    });
    it('should list the goals for a label', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        const state = treeDataSlice.reducer(initialState, addGoalToTab(goal));

        expect(selectGoalsForLabel({treeData: state}, goal.type)?.some((g) => g.id === goal.id)).toBeTruthy();
    });
    it('should allow the goals to be reset', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        const state1 = treeDataSlice.reducer(initialState, addGoalToTab(goal));

        expect(selectGoalsForLabel({treeData: state1}, goal.type)?.some((g) => g.id === goal.id)).toBeTruthy();

        const state2 = treeDataSlice.reducer(state1, reset());
        expect(selectGoalsForLabel({treeData: state2}, goal.type)?.some((g) => g.id === goal.id)).toBeFalsy();
    });
    it('should add a goal to the tree', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.goals).not.toContain(goal.id);
        const state = treeDataSlice.reducer(initialState, addGoalToTree(goal));

        expect(state.treeIds).toContain(goal.id);
    });
    it('should remove a goal and goal id from the tree', () => {
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(initialState.goals).not.toContain(goal.id);
        const state1 = treeDataSlice.reducer(initialState, addGoalToTree(goal));

        expect(state1.treeIds).toContain(goal.id);

        const state2 = treeDataSlice.reducer(initialState, deleteGoal(goal));
        expect(state2.treeIds).not.toContain(goal.id);
    });
    it('should have tree as type TreeItem[]', () => {
        const {tree} = initialState;
        const testTree: TreeItem[] = tree;

        expect(testTree).toBeTruthy();
    });
});