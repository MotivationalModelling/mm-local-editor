import {renderHook, act} from '@testing-library/react';
import {describe, it, expect} from "vitest";
import useTreeData from "./useTreeData";
import {newTreeItem} from "../components/context/FileProvider.tsx";

describe('useTreeData', () => {
    it('should start with five tabs', () => {
        const {result} = renderHook(() => useTreeData());
        const {tabs} = result.current;

        expect(Object.keys(tabs).length).toEqual(5);
    });
    it('should add a goal to the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(Object.keys(result.current.tabs).length).toEqual(5);
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();

        act(() => addGoal(goal));
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeTruthy();
    });
    it('removes a goal from the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, deleteGoal} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();

        act(() => addGoal(goal));
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeTruthy();

        act(() => deleteGoal(goal));
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();
    });
    it('ignores removing an nx goal from the tree', () => {
        const {result} = renderHook(() => useTreeData());
        const {deleteGoal} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();
        act(() => deleteGoal(goal));
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();
    });
    it('should reverts to original tree on reset', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoal, reset} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();

        act(() => addGoal(goal));
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeTruthy();

        act(() => reset());

        expect(result.current.tabs[goal.type].includes(goal.id)).toBeFalsy();
    });
    it('should update text of the goal', () => {
        const {result} = renderHook(() => useTreeData());
        const {goals, updateTextForGoalId} = result.current;
        const goal = goals[result.current.tabs["Do"][0]];
        const text = "Hello, world!";

        expect(goal.content).not.toEqual(text);

        act(() => updateTextForGoalId({id: goal.id, text}));

        expect(result.current.goals[goal.id].content).toEqual(text);
    });
    it('should add a goal to correct tab', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoalToTab} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        expect(result.current.tabs[goal.type].length).toEqual(1);

        act(() => addGoalToTab(goal));

        // check added to tree
        expect(result.current.tabs[goal.type].length).toEqual(2);
        // check added to correct tab
        expect(result.current.tabs[goal.type].includes(goal.id)).toBeTruthy();
        // check added to goals
        expect(goal.id in result.current.goals).toBeTruthy();
    });
    it('should list the goals for a label', () => {
        const {result} = renderHook(() => useTreeData());
        const {addGoalToTab} = result.current;
        const goal = newTreeItem({id: 7, type: "Do", content: "example"});

        act(() => addGoalToTab(goal));

        expect(result.current.goalsForLabel(goal.type).some((g) => g.id === goal.id)).toBeTruthy();
    });
    it('should allow the goals to be reset', () => {

    });
});
