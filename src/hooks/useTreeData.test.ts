import {renderHook, act} from '@testing-library/react';
import {describe, it, expect} from "vitest";
import useTreeData from "./useTreeData";
import {newTreeItem} from "../components/context/FileProvider.tsx";

describe('useTreeData', () => {
    it('should start with five tabs', () => {
        const {result} = renderHook(() => useTreeData());
        const {tabData, treeData} = result.current;

        expect(tabData.length).toEqual(5);
        expect(treeData.length).toEqual(5);
    });
    it('should add a goal to the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "it"})));

        expect(result.current.treeData.length).toEqual(6);
    });
    it('removes a goal from the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, deleteGoalWithId} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "it"})));

        expect(result.current.treeData.length).toEqual(6);

        act(() => deleteGoalWithId(7));
        expect(result.current.treeData.length).toEqual(5);
    });
    it('ignores removing an nx goal from the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {deleteGoalWithId} = result.current;

        expect(result.current.treeData.length).toEqual(5);
        act(() => deleteGoalWithId(7));
        expect(result.current.treeData.length).toEqual(5);
    });
    it('should reverts to original tree on reset', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, reset} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "it"})));
        expect(result.current.treeData.length).toEqual(6);

        act(() => reset());

        expect(result.current.treeData.length).toEqual(5);
    });
    it('should update text of the goal', () => {
        const {result} = renderHook(() => useTreeData());
        const {updateTextForTreeId} = result.current;
        const goal = result.current.treeData[0];
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);

        act(() => updateTextForTreeId({id: goal.id, text}));

        expect(result.current.treeData[0].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoalToTab} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "it"});

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoalToTab(goal));

        // check added to tree
        expect(result.current.treeData.length).toEqual(6);
        // check added to correct tab
        const tab = result.current.tabData.find((tab) => tab.label === goal.type);
        expect(tab).toBeTruthy();
        (tab) && expect(tab.rows.filter((item) => item.id === goal.id)).toHaveLength(1);
    });
});
