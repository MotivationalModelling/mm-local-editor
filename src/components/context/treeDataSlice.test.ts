/**
* @jest-environment jsdom
*/
// Leave this (^) or you will see "ReferenceError: document is not defined" from renderHook

import {beforeAll, beforeEach, describe, expect, it} from "vitest";
import {
    addGoal,
    addGoalToTab,
    addGoalToTree,
    createInitialState,
    createTreeGoalNode,
    deleteGoalFromGoalList,
    deleteGoalReferenceFromHierarchy,
    findTreeGoalByInstanceId,
    removeItemIdFromTree,
    reset,
    selectGoalsForLabel,
    treeDataSlice,
    updateTextForGoalId
} from "./treeDataSlice";
import {enableMapSet} from "immer";
import {initialTabs} from "../../data/initialTabs.ts";
import {newTreeGoal, TreeGoal, InstanceId} from "../types.ts";

describe('treeDataSlice', () => {
    // turns on Map/Set support
    beforeAll(() => {
        enableMapSet();
    });

    let initialState: ReturnType<typeof createInitialState>;
    
    // every test gets a fresh clean initial state
    // reducers must behave correctly starting from a known, predictable state
    beforeEach(() => {
        initialState = createInitialState(initialTabs, []);
    });

    it('should start with five tabs', () => {
        expect(initialState.tabs.size).toEqual(5);
    });

    it('should add a goal', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.size).toEqual(5);
        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const newState = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(newState.tabs.get(goal.type)?.goalIds).toContain(goal.id);
    });
    it('removes a goal', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});
        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const state1 = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(state1.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        const state2 = treeDataSlice.reducer(initialState, deleteGoalFromGoalList(goal));
        expect(state2.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('ignores removing an nx goal', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});
        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const state2 = treeDataSlice.reducer(initialState, deleteGoalFromGoalList(goal));
        expect(state2.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('should revert on reset', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

        expect(initialState.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        const state1 = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(state1.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        const state2 = treeDataSlice.reducer(initialState, reset());

        expect(state2.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
        expect(state2.tabs.size).toEqual(5);
    });
    it('should update text of the goal', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);
        const state1 = treeDataSlice.reducer(initialState, addGoal(goal));
        expect(state1.goals[goal.id].content).not.toEqual(text);

        const state2 = treeDataSlice.reducer(initialState, updateTextForGoalId({id: goal.id, text}));

        expect(state2.goals[goal.id].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

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
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

        const state = treeDataSlice.reducer(initialState, addGoalToTab(goal));

        expect(selectGoalsForLabel({treeData: state}, goal.type)?.some((g) => g.id === goal.id)).toBeTruthy();
    });
    it('should allow the goals to be reset', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

        const state1 = treeDataSlice.reducer(initialState, addGoalToTab(goal));

        expect(selectGoalsForLabel({treeData: state1}, goal.type)?.some((g) => g.id === goal.id)).toBeTruthy();

        const state2 = treeDataSlice.reducer(state1, reset());
        expect(selectGoalsForLabel({treeData: state2}, goal.type)?.some((g) => g.id === goal.id)).toBeFalsy();
    });
    it('should add a goal to the tree', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});
        expect(Object.keys(initialState.treeIds)).not.toContain(String(goal.id));
        
        const state = treeDataSlice.reducer(initialState, addGoalToTree(goal));
        expect(Object.keys(state.treeIds)).toContain(String(goal.id));
    });
    it('should remove a goal\'s reference from the tree', () => {
        const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

        expect(Object.keys(initialState.treeIds)).not.toContain(String(goal.id));

        const state1 = treeDataSlice.reducer(initialState, addGoalToTree(goal));

        const instanceId = state1.treeIds[goal.id][0];
    
        expect(Object.keys(state1.treeIds)).toContain(String(goal.id));
        expect(Object.values(state1.treeIds)).not.toContain(instanceId);

        const state2 = treeDataSlice.reducer(
            state1,
            deleteGoalReferenceFromHierarchy({
                ...goal,
                instanceId, // overwrite
            })
        );
        // only remove the reference
        expect(Object.keys(state1.treeIds)).toContain(String(goal.id));
        expect(Object.values(state2.treeIds)).not.toContain(instanceId);
    });

    it('should have tree as type TreeGoal[]', () => {
        const {tree} = initialState;
        const testTree: TreeGoal[] = tree;

        expect(testTree).toBeTruthy();
    });
    it('should remove a node from the top level', () => {
        const id = 1;
        const node = createTreeGoalNode(initialState.treeIds, { id, type: "Do" });
        const instanceId = node.instanceId;

        const tree: TreeGoal[] = [node];
        expect(tree).toHaveLength(1);

        const newTree = removeItemIdFromTree(tree, id, instanceId);

        expect(newTree).toHaveLength(0);
    });
    it('should remove a node from the second level', () => {
        const id = 1;
        const childrenNode = createTreeGoalNode(initialState.treeIds, { id, type: "Do" });
        const childrenInstanceId = childrenNode.instanceId
        const initialNode = createTreeGoalNode(initialState.treeIds, { id: 0, type: "Do", children: [childrenNode]});
        const tree: TreeGoal[] = [initialNode];

        expect(tree.length).toEqual(1);
        expect(tree[0].children?.length).toEqual(1);

        const newTree = removeItemIdFromTree(tree, id, childrenInstanceId);

        expect(newTree.length).toEqual(1);
        expect(tree[0].children?.length).toEqual(0);
    });
});

describe('findTreeGoalByInstanceId', () => {
    const treeIds: Record<TreeGoal["id"], InstanceId[]> = {};
    const testTree = [
        createTreeGoalNode(treeIds, {
            id: 1,
            type: "Do",
            children: [
                createTreeGoalNode(treeIds, {id: 2, type: "Do"}),
                createTreeGoalNode(treeIds, {id: 3, type: "Do"})
            ],
        }),
        createTreeGoalNode(treeIds, {id: 4, type: "Do"})
    ];
    it('should handle an empty tree', () => {
        const tree: TreeGoal[] = [];
        const instanceId: InstanceId = "2-3";
        expect(findTreeGoalByInstanceId(tree, instanceId)).toBeUndefined();
    });
    it('should return the tree node with correct Id', () => {
        const targetInstanceId: InstanceId = "1-1";
        const targetId = 1;
        expect(findTreeGoalByInstanceId(testTree, targetInstanceId)?.id).toBe(targetId);
    });
    it('should return the correct tree node in children level', () => {
        const targetInstanceId: InstanceId = "3-1";
        const targetId = 3;
        expect(findTreeGoalByInstanceId(testTree, targetInstanceId)?.id).toBe(targetId);
    });
    it('should return undefined if node not found', () => {
        const nonExistentId: InstanceId = "999-999";
        expect(findTreeGoalByInstanceId(testTree, nonExistentId)).toBeUndefined();
    });
});
