/**
* @jest-environment jsdom
*/
import {act, renderHook} from '@testing-library/react';
import {beforeAll, describe, expect, it} from "vitest";
import FileProvider, {createTreeIdsFromTreeData, useFileContext} from "./FileProvider";
import {newTreeItem, TreeNode} from "../types.ts";
import {enableMapSet} from "immer";
import {
    addGoal,
    addGoalToTab,
    addGoalToTree,
    deleteGoalFromGoalList,
    reset,
    updateTextForGoalId,
} from "./treeDataSlice.ts";

// FileProvider provides data than UI
const wrapper = ({ children}:React.PropsWithChildren) => (
    <FileProvider>{children}</FileProvider>
);
const { result } = renderHook(() => useFileContext(), { wrapper });
const {dispatch} = result.current;
const goal = newTreeItem({id: 7, type: "Do", content: "example"});

// FileProvider provides real data
// Inner useFileContext will found nearest provider

describe('FileProvider', () => {
    beforeAll(() => enableMapSet());

    it('should start with 5 tabs, each has a arrays of goals', () => {

        const { tabData } = result.current;

        expect(tabData.length).toBe(5);

        tabData.forEach(tab => {
            expect(tab).toHaveProperty("goalIds");
            expect(Array.isArray(tab.goalIds)).toBe(true);
        });
    });
    it('should add a new goal to the "Do" tab', () => {

        let doTab = result.current.tabs.get(goal.type);

        expect(doTab).toBeTruthy();    
        expect(doTab!.goalIds).not.toContain(goal.id);

        act(() => dispatch(addGoal(goal)));

        doTab = result.current.tabs.get(goal.type)
        expect(doTab?.goalIds).toContain(goal.id);
    });
    it('removes a goal from the "Do" tab', () => {

        let doTab = result.current.tabs.get(goal.type);

        // already had
        expect(doTab).toBeTruthy();    
        expect(doTab!.goalIds).toContain(goal.id);

        act(() => dispatch(deleteGoalFromGoalList(goal)));
        doTab = result.current.tabs.get(goal.type)
        expect(doTab?.goalIds).not.toContain(goal.id);
    });
    it('should ignore removing an non-exist goal', () => {
        let doTab = result.current.tabs.get(goal.type);

         // remove/not exist
        expect(doTab).toBeTruthy();    
        expect(doTab!.goalIds).not.toContain(goal.id);

        act(() => dispatch(deleteGoalFromGoalList(goal)));
        doTab = result.current.tabs.get(goal.type)
        expect(doTab!.goalIds).not.toContain(goal.id);
    });

    it('should revert on reset', () => {
        let doTab = result.current.tabs.get(goal.type);

        expect(doTab).toBeTruthy();    
        expect(doTab!.goalIds).not.toContain(goal.id);

        act(() => dispatch(addGoal(goal)));
        doTab = result.current.tabs.get(goal.type)
        expect(doTab!.goalIds).toContain(goal.id);

        act(() => dispatch(reset()));
        doTab = result.current.tabs.get(goal.type)
        expect(doTab!.goalIds).not.toContain(goal.id);
        // orignal
        expect(Object.keys(result.current.goals).length).toEqual(5);
    });
    it('should update text of the goal', () => {
        
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);

        act(() => dispatch(updateTextForGoalId({id: goal.id, text})));

        expect(result.current.goals[goal.id].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {

        expect(result.current.tabs.get(goal.type)?.goalIds).toHaveLength(1);

        act(() => dispatch(addGoalToTab(goal)));

        // check added to tab
        expect(result.current.tabs.get(goal.type)?.goalIds).toHaveLength(2);
        // check added to correct tab
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);
        // check added to goals
        expect(result.current.goals).toHaveProperty(String(goal.id));
    });

    it('should add a goal to the tree', () => {
        let treeData = result.current.tree;
        expect(treeData).not.toContainEqual(expect.objectContaining({ goalId: goal.id }));

        act(() => dispatch(addGoalToTree(goal)));
        treeData = result.current.tree;
        expect(treeData).toContainEqual(expect.objectContaining({ goalId: goal.id }));
    });

    it('should remove a goal and goal id from the tree', () => {
        let treeData = result.current.tree;
        expect(treeData).toContainEqual(expect.objectContaining({ goalId: goal.id }));

        act(() => dispatch(deleteGoalFromGoalList(goal)));
        treeData = result.current.tree;
        expect(result.current.treeIds).not.toContain(goal.id);
    });
    it('should have tree as type TreeNode[]', () => {

        const {tree} = result.current;
        const testTree: TreeNode[] = tree;

        expect(testTree).toBeTruthy();
    });
});

describe('#createTreeIdsFromTreeData', () => {
    it('should handle a single node', () => {
        const treeData = [newTreeItem({type: "Do", id: 1})];
        const treeIds = createTreeIdsFromTreeData(treeData);

        expect(Object.keys(treeIds)).toEqual(["1"]);
    });

    it('should handle a pair of nodes', () => {
        const treeData = [
            newTreeItem({type: "Do", id: 1}),
            newTreeItem({type: "Do", id: 2})
        ];
        const treeIds = createTreeIdsFromTreeData(treeData);

        expect(Object.keys(treeIds)).toEqual(["1","2"]);
    });
    it('should handle nested nodes', () => {
        const treeData = [
                newTreeItem({type: "Do", id: 1, children: [
                    newTreeItem({type: "Do", id: 2})
            ]})
        ];
        const treeIds = createTreeIdsFromTreeData(treeData);

        const expected = {
        1: ["1-0"],
        2: ["2-0"],
        };

        expect(treeIds).toEqual(expected);

    });
});
