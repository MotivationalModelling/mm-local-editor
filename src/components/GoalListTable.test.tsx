/**
* @jest-environment jsdom
*/
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import FileProvider, {LocalStorageType} from "./context/FileProvider.tsx";
import GoalList from "./GoalList.tsx";
import {newTreeGoal} from "./types.ts";

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe("GoalListTable", () => {
    it.each([1, 2])("shows all %i selected goal(s) in the drag image", (selectionCount) => {
        const goals = [
            newTreeGoal({id: 10, type: "Do", content: "First goal"}),
            newTreeGoal({id: 11, type: "Do", content: "Second goal"}),
        ];
        const selectedGoals = goals.slice(0, selectionCount);
        const dataTransfer = {
            setData: vi.fn(),
            setDragImage: vi.fn(),
        };
        localStorage.setItem(LocalStorageType.TAB, JSON.stringify([{
            label: "Do",
            icon: "/img/Function.png",
            rows: goals
        }]));
        localStorage.setItem(LocalStorageType.TREE, "[]");

        render(
            <FileProvider>
                <GoalList groupSelected={selectedGoals}
                          setGroupSelected={vi.fn()}
                          handleSynTableTree={vi.fn()}
                          handleDropGroupSelected={vi.fn()}/>
            </FileProvider>
        );
        fireEvent.dragStart(screen.getByLabelText("Drag First goal goal"), {dataTransfer});

        const dragImage = dataTransfer.setDragImage.mock.calls[0][0] as HTMLElement;
        expect(dragImage.className).toBe("d-grid gap-1");
        selectedGoals.forEach((goal) => expect(dragImage.textContent).toContain(goal.content));
    });
});
