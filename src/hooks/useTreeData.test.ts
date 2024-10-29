import {renderHook, act} from '@testing-library/react';
import {describe, it, expect, beforeAll} from "vitest";
import useTreeData, {createTreeIdsFromTreeData} from "./useTreeData";
import {newTreeItem} from "../components/context/FileProvider.tsx";
import {enableMapSet} from "immer";

describe('useTreeData', () => {
    beforeAll(() => enableMapSet());
    it('should start with five tabs', () => {
        const {result} = renderHook(() => useTreeData());
        const {tabs} = result.current;

        expect(tabs.size).toEqual(5);
    });
    it('should add a goal', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.size).toEqual(5);
        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        act(() => addGoal(goal));
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);
    });
    it('removes a goal', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, deleteGoal} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        act(() => addGoal(goal));
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        act(() => deleteGoal(goal));
        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('ignores removing an nx goal', () => {
        const {result} = renderHook(() => useTreeData());
        const {deleteGoal} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
        act(() => deleteGoal(goal));
        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('should revert on reset', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, reset} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        act(() => addGoal(goal));
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        act(() => reset());

        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);
    });
    it('should update text of the goal', () => {
        const {result} = renderHook(() => useTreeData());
        const {updateTextForGoalId} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);

        act(() => updateTextForGoalId({id: goal.id, text}));

        expect(result.current.goals[goal.id].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoalToTab} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds.length).toEqual(1);

        act(() => addGoalToTab(goal));

        // check added to tab
        expect(result.current.tabs.get(goal.type)?.goalIds.length).toEqual(2);
        // check added to correct tab
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);
        // check added to goals
        expect(result.current.goals).toContain(goal.id);
    });
    it('should list the goals for a label', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoalToTab} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        act(() => addGoalToTab(goal));

        expect(result.current.goalsForLabel(goal.type)?.some((g) => g.id === goal.id)).toBeTruthy();
    });
    it('should allow the goals to be reset', () => {

    });
    it('should add a goal to the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoalToTree} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.goals).not.toContain(goal.id);
        act(() => addGoalToTree(goal));

        expect(result.current.treeIds).toContain(goal.id);
    })
});

describe('#createTreeIdsFromTreeData', () => {
    it('should handle a single node', () => {
        const treeData = [newTreeItem({type: "Do", id: 1})];
        const treeIds = createTreeIdsFromTreeData(treeData);

        expect(treeIds).toEqual([1]);
    });
    it('should handle a pair of nodes', () => {
        const treeData = [
            newTreeItem({type: "Do", id: 1}),
            newTreeItem({type: "Do", id: 2})
        ];
        const treeIds = createTreeIdsFromTreeData(treeData);

        expect(treeIds).toEqual([1, 2]);
    });
    it('should handle nested nodes', () => {
        const treeData = [
            newTreeItem({type: "Do", id: 1, children: [
                newTreeItem({type: "Do", id: 2})
            ]})
        ];
        const treeIds = createTreeIdsFromTreeData(treeData);

        expect(treeIds).toEqual([1, 2]);
    });
});
