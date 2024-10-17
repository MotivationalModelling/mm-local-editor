import {renderHook, act} from '@testing-library/react';
import {describe, test, expect} from "vitest";
import useTreeData from "./useTreeData";
import {newTreeItem} from "../components/context/FileProvider.tsx";

describe('useTreeData', () => {
    test('default number of tabs is five', () => {
        const {result} = renderHook(() => useTreeData());
        const {tabData, treeData} = result.current;

        expect(tabData.length).toEqual(5);
        expect(treeData.length).toEqual(5);
    });
    test('add a goal to the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "test"})));

        expect(result.current.treeData.length).toEqual(6);
    });
    test('remove a goal from the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, deleteGoalWithId} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "test"})));

        expect(result.current.treeData.length).toEqual(6);

        act(() => deleteGoalWithId(7));
        expect(result.current.treeData.length).toEqual(5);
    });
    test('removing an nx goal from the tree makes no change', () => {
        const {result} = renderHook(() => useTreeData());
        const {deleteGoalWithId} = result.current;

        expect(result.current.treeData.length).toEqual(5);
        act(() => deleteGoalWithId(7));
        expect(result.current.treeData.length).toEqual(5);
    });
    test('reset reverts to original tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, reset} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "test"})));
        expect(result.current.treeData.length).toEqual(6);

        act(() => reset());

        expect(result.current.treeData.length).toEqual(5);
    });
});
