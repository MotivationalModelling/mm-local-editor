/**
* @jest-environment jsdom
*/
import React, {createRef} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import FileProvider from "./context/FileProvider.tsx";
import GoalListTable from "./GoalListTable.tsx";
import {newTreeGoal} from "./types.ts";

describe("GoalListTable", () => {
    it("shows every selected goal in the drag image", () => {
        const goals = [
            newTreeGoal({id: 10, type: "Do", content: "First goal"}),
            newTreeGoal({id: 11, type: "Do", content: "Second goal"}),
        ];
        const dataTransfer = {
            setData: vi.fn(),
            setDragImage: vi.fn(),
        };

        render(
            <FileProvider>
                <GoalListTable label="Do"
                               goals={goals}
                               groupSelected={goals}
                               setGroupSelected={vi.fn()}
                               handleSynTableTree={vi.fn()}
                               inputRef={createRef<HTMLInputElement>()}/>
            </FileProvider>
        );
        fireEvent.dragStart(screen.getByLabelText("Drag First goal goal"), {dataTransfer});

        const dragImage = dataTransfer.setDragImage.mock.calls[0][0] as HTMLElement;
        expect(dragImage.textContent).toContain("First goal");
        expect(dragImage.textContent).toContain("Second goal");
    });
});
