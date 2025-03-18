/**
* @jest-environment jsdom
*/
import {renderHook, act, render} from '@testing-library/react';
import {describe, it, expect, beforeAll} from "vitest";
import FileProvider, {
    useFileContext,
    createTreeIdsFromTreeData
} from "./FileProvider";
import {newTreeItem, TreeItem} from "./FileProvider";
import {enableMapSet} from "immer";
import {
    addGoal,
    addGoalToTab, addGoalToTree,
    deleteGoal,
    reset,
    updateTextForGoalId
} from "./treeDataSlice.ts";

const TestFileProviderContext = () => {
    const context = useFileContext();

    describe("test default tab length", () => {
        expect(context.tabData).toHaveLength(5);
    });
    return (
        <div>
            tabs {context.tabData.length}
        </div>
    )
};

describe('useFileContext', () => {
    beforeAll(() => enableMapSet());
    it("should render with default tabs", () => {
        const {container, getByText} = render(
            <FileProvider>
                <TestFileProviderContext/>
            </FileProvider>
        );
    });
    it('should start with five tabs', () => {
        const {result} = renderHook(() => useFileContext());
        const {tabs} = result.current;

        expect(tabs.size).toEqual(5);
    });
    it('should start with tabs having arrays of goals', () => {
        const {result} = renderHook(() => useFileContext());
        const {tabData} = result.current;

        tabData.forEach((tab) => {
            expect(tab).toHaveProperty('rows');
        });
    });
    it('should add a goal', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.size).toEqual(5);
        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        act(() => dispatch(addGoal(goal)));
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);
    });
    it('removes a goal', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        act(() => dispatch(addGoal(goal)));
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        act(() => dispatch(deleteGoal(goal)));
        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('ignores removing an nx goal', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
        act(() => dispatch(deleteGoal(goal)));
        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
    });
    it('should revert on reset', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);

        act(() => dispatch(addGoal(goal)));
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);

        act(() => dispatch(reset()));

        expect(result.current.tabs.get(goal.type)?.goalIds).not.toContain(goal.id);
        expect(result.current.tabs.size).toEqual(5);
    });
    it('should update text of the goal', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);

        act(() => dispatch(updateTextForGoalId({id: goal.id, text})));

        expect(result.current.goals[goal.id].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs.get(goal.type)?.goalIds).toHaveLength(1);

        act(() => dispatch(addGoalToTab(goal)));

        // check added to tab
        expect(result.current.tabs.get(goal.type)?.goalIds).toHaveLength(2);
        // check added to correct tab
        expect(result.current.tabs.get(goal.type)?.goalIds).toContain(goal.id);
        // check added to goals
        expect(result.current.goals).toHaveProperty(String(goal.id));
    });
    it('should list the goals for a label', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        act(() => dispatch(addGoalToTab(goal)));

        expect(result.current.goalsForLabel(goal.type)?.some((g) => g.id === goal.id)).toBeTruthy();
    });
    it('should allow the goals to be reset', () => {

    });
    it('should add a goal to the tree', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.goals).not.toContain(goal.id);
        act(() => dispatch(addGoalToTree(goal)));

        expect(result.current.treeIds).toContain(goal.id);
    });
    it('should remove a goal and goal id from the tree', () => {
        const {result} = renderHook(() => useFileContext());
        const {dispatch} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.goals).not.toContain(goal.id);
        act(() => dispatch(addGoalToTree(goal)));

        expect(result.current.treeIds).toContain(goal.id);

        act(() => dispatch(deleteGoal(goal)));
        expect(result.current.treeIds).not.toContain(goal.id);
    });
    it('should have tree as type TreeItem[]', () => {
        const {result} = renderHook(() => useFileContext());
        const {tree} = result.current;
        const testTree: TreeItem[] = tree;

        expect(testTree).toBeTruthy();
    });
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
