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
    test('test adding a goal to the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal} = result.current;

        expect(result.current.treeData.length).toEqual(5);

        act(() => addGoal(newTreeItem({id: 7, type: "Do", content: "test"})));

        expect(result.current.treeData.length).toEqual(6);
    })
});
