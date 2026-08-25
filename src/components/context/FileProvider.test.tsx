/**
* @jest-environment jsdom
*/
import {act, cleanup, fireEvent, render, renderHook, screen} from '@testing-library/react';
import {afterEach, beforeAll, beforeEach, describe, expect, it} from "vitest";
import FileProvider, {createTreeIdsFromTreeData, getDefaultModel, LocalStorageType, useFileContext} from "./FileProvider";
import {defaultTreeData, initialTabs} from "../../data/initialTabs.ts";
import {newTreeGoal, TreeGoal} from "../types.ts";
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
const wrapper = ({children}: React.PropsWithChildren) => (
    <FileProvider>{children}</FileProvider>
);
const {result} = renderHook(() => useFileContext(), {wrapper});
const {dispatch} = result.current;
const goal = newTreeGoal({id: 7, type: "Do", content: "example"});

// FileProvider provides real data
// Inner useFileContext will found nearest provider

describe('FileProvider', () => {
    beforeAll(() => {
        enableMapSet();
    });

    it('should start with 5 tabs, each has a arrays of goals', () => {
        const {tabData} = result.current;

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

        doTab = result.current.tabs.get(goal.type);
        expect(doTab?.goalIds).toContain(goal.id);
    });
    it('removes a goal from the "Do" tab', () => {
        let doTab = result.current.tabs.get(goal.type);

        // already had
        expect(doTab).toBeTruthy();
        expect(doTab!.goalIds).toContain(goal.id);

        act(() => dispatch(deleteGoalFromGoalList(goal)));
        doTab = result.current.tabs.get(goal.type);
        expect(doTab?.goalIds).not.toContain(goal.id);
    });
    it('should ignore removing an non-exist goal', () => {
        let doTab = result.current.tabs.get(goal.type);

        // remove/not exist
        expect(doTab).toBeTruthy();
        expect(doTab!.goalIds).not.toContain(goal.id);

        act(() => dispatch(deleteGoalFromGoalList(goal)));
        doTab = result.current.tabs.get(goal.type);
        expect(doTab!.goalIds).not.toContain(goal.id);
    });

    it('should revert on reset', () => {
        let doTab = result.current.tabs.get(goal.type);

        expect(doTab).toBeTruthy();
        expect(doTab!.goalIds).not.toContain(goal.id);

        act(() => dispatch(addGoal(goal)));
        doTab = result.current.tabs.get(goal.type);
        expect(doTab!.goalIds).toContain(goal.id);

        act(() => dispatch(reset()));
        doTab = result.current.tabs.get(goal.type);
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
        expect(treeData).not.toContainEqual(expect.objectContaining({id: goal.id}));

        act(() => dispatch(addGoalToTree(goal)));
        treeData = result.current.tree;
        expect(treeData).toContainEqual(expect.objectContaining({id: goal.id}));
        expect(result.current.treeIds).toHaveProperty(String(goal.id));
    });

    it('should remove a goal and goal id from the tree', () => {
        let treeData = result.current.tree;
        expect(treeData).toContainEqual(expect.objectContaining({id: goal.id}));

        act(() => dispatch(deleteGoalFromGoalList(goal)));
        treeData = result.current.tree;
        expect(result.current.treeIds).not.toContain(goal.id);
    });
    it('should have tree as type TreeGoal[]', () => {
        const {tree} = result.current;
        const testTree: TreeGoal[] = tree;

        expect(testTree).toBeTruthy();
    });
});

describe('#createTreeIdsFromTreeData', () => {
    it("should handle a node which isn't in the tree", () => {
        const g1 = newTreeGoal({type: "Do", id: 1});
        const goals = {[g1.id]: g1};
        const treeData = [] as TreeGoal[];
        const treeIds = createTreeIdsFromTreeData(goals, treeData);

        expect(Object.keys(treeIds)).toEqual([`${g1.id}`]);
        expect(treeIds[g1.id]).toEqual([]);
    });
    it('should handle a single node', () => {
        const g1 = newTreeGoal({type: "Do", id: 1});
        const goals = {[g1.id]: g1};
        const treeData = [g1];
        const treeIds = createTreeIdsFromTreeData(goals, treeData);

        expect(Object.keys(treeIds)).toEqual([`${g1.id}`]);
        expect(treeIds[g1.id]).toEqual(["1-0"]);
    });
    it('should raise an exception when a node is in the tree but not in goals', () => {
        const g1 = newTreeGoal({type: "Do", id: 1});
        const goals = {};
        const treeData = [g1];
        expect(() => createTreeIdsFromTreeData(goals, treeData)).toThrowError(`goal ${g1.id} in tree but not in goal list`);
    });
    it('should handle a pair of nodes', () => {
        const g1 = newTreeGoal({type: "Do", id: 1});
        const g2 = newTreeGoal({type: "Do", id: 2});
        const goals = {[g1.id]: g1, [g2.id]: g2};
        const treeData = [g1, g2];
        const treeIds = createTreeIdsFromTreeData(goals, treeData);

        expect(Object.keys(treeIds)).toEqual(["1", "2"]);
        expect(treeIds[g1.id]).toEqual(["1-0"]);
        expect(treeIds[g2.id]).toEqual(["2-0"]);
    });
    it('should handle nested nodes', () => {
        const g2 = newTreeGoal({type: "Do", id: 2});
        const g1 = newTreeGoal({type: "Do", id: 1, children: [g2]});
        const goals = {[g1.id]: g1, [g2.id]: g2};
        const treeData = [g1];
        const treeIds = createTreeIdsFromTreeData(goals, treeData);

        expect(Object.keys(treeIds)).toEqual(["1", "2"]);
        expect(treeIds[g1.id]).toEqual(["1-0"]);
        expect(treeIds[g2.id]).toEqual(["2-0"]);
    });
});

describe('default model', () => {
    beforeEach(() => {
        localStorage.removeItem(LocalStorageType.DEFAULT_MODEL);
    });

    it('should use the predefined model when no custom default is saved', () => {
        expect(getDefaultModel().treeData).toEqual(defaultTreeData);
    });

    it('should use the predefined model when the custom default is invalid', () => {
        localStorage.setItem(LocalStorageType.DEFAULT_MODEL, JSON.stringify({
            tabData: initialTabs,
            treeData: [newTreeGoal({id: 999, type: "Do"})],
        }));

        expect(getDefaultModel().treeData).toEqual(defaultTreeData);
    });

    it('should save and load the current model as the default', () => {
        const child = newTreeGoal({id: 102, type: "Do", content: "Child"});
        const parent = newTreeGoal({
            id: 101,
            type: "Do",
            content: "Parent",
            children: [child],
            x: 120,
            y: 240,
        });
        const tabData = initialTabs.map((tab) => ({
            ...tab,
            rows: tab.label === "Do" ? [parent, child] : [],
        }));
        const {result: customResult} = renderHook(() => useFileContext(), {wrapper});

        act(() => customResult.current.dispatch(reset({tabData, treeData: [parent]})));
        act(() => customResult.current.saveCurrentModelAsDefault());
        act(() => customResult.current.dispatch(reset()));
        act(() => customResult.current.loadDefaultModel());

        expect(customResult.current.tree).toEqual([parent]);
        expect(customResult.current.tree[0].children).toEqual([child]);
        expect(customResult.current.tree[0]).toMatchObject({x: 120, y: 240});
    });
});

describe('corrupted localStorage recovery', () => {
    const corruptTree = JSON.stringify([
        {id: 999, instanceId: "999-1", type: "Do", content: "orphan", children: []},
    ]);
    const seededTabs = JSON.stringify(initialTabs);

    // The module-level renderHook provider above stays mounted and would
    // sync to the corrupted storage via use-local-storage's storage events,
    // rendering a second copy of the recovery modal.
    beforeAll(() => cleanup());

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(LocalStorageType.TREE, corruptTree);
        localStorage.setItem(LocalStorageType.TAB, seededTabs);
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
    });

    const renderProvider = () => render(
        <FileProvider><div data-testid="editor"/></FileProvider>
    );

    it('shows the recovery modal instead of the editor when the tree references missing goals', () => {
        renderProvider();

        expect(screen.getByText("Saved data is corrupted")).toBeTruthy();
        expect(screen.queryByTestId("editor")).toBeNull();
        expect(localStorage.getItem(LocalStorageType.TREE)).toBe(corruptTree);
    });

    it('shows the recovery modal when tabData is valid JSON of the wrong shape', () => {
        localStorage.clear();
        localStorage.setItem(LocalStorageType.TAB, '{"broken": 1}');
        renderProvider();

        expect(screen.getByText("Saved data is corrupted")).toBeTruthy();
        expect(screen.queryByTestId("editor")).toBeNull();
        expect(JSON.parse(localStorage.getItem(LocalStorageType.TAB)!)).toEqual({broken: 1});
    });

    it('shows the recovery modal when stored data is not parseable JSON', () => {
        localStorage.clear();
        localStorage.setItem(LocalStorageType.TREE, '{not valid json');
        renderProvider();

        expect(screen.getByText("Saved data is corrupted")).toBeTruthy();
        expect(screen.queryByTestId("editor")).toBeNull();
    });

    it('abandon leaves unparseable data byte-for-byte intact for inspection', () => {
        const garbage = '{not valid json';
        localStorage.clear();
        localStorage.setItem(LocalStorageType.TREE, garbage);
        renderProvider();

        fireEvent.click(screen.getByText("Abandon"));

        expect(localStorage.getItem(LocalStorageType.TREE)).toBe(garbage);
    });

    it('abandon pauses the app and leaves storage untouched', () => {
        renderProvider();

        fireEvent.click(screen.getByText("Abandon"));

        expect(screen.queryByTestId("editor")).toBeNull();
        expect(screen.getByText(/left unchanged/)).toBeTruthy();
        expect(localStorage.getItem(LocalStorageType.TREE)).toBe(corruptTree);
        expect(localStorage.getItem(LocalStorageType.TAB)).toBe(seededTabs);
    });

    it('revert to default replaces storage and renders the editor', () => {
        // Corrupt both keys: revert has to replace both, or the editor
        // stays blocked behind the modal and the queries below fail
        localStorage.setItem(LocalStorageType.TAB, '{"broken": 1}');
        renderProvider();

        fireEvent.click(screen.getByText("Revert to default"));

        expect(screen.getByTestId("editor")).toBeTruthy();
        expect(JSON.parse(localStorage.getItem(LocalStorageType.TREE)!)).toEqual([]);
        expect(JSON.parse(localStorage.getItem(LocalStorageType.TAB)!)).toEqual(JSON.parse(seededTabs));
    });
});
