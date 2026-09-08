/**
 * @jest-environment jsdom
 */
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import SaveFileButton from "./SaveFileButton";

const fileContext = vi.hoisted(() => ({current: {} as Record<string, unknown>}));

vi.mock("../context/FileProvider", () => ({
    useFileContext: () => fileContext.current,
}));

vi.mock("../utils/GraphUtils", () => ({
    returnFocusToGraph: vi.fn(),
}));

vi.mock("../context/GraphContext", () => ({useGraph: () => ({graph: null})}));

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("SaveFileButton", () => {
    it("exports the current tab and tree data as JSON", async () => {
        const treeData = [{id: 1, content: "Old text", type: "Do", instanceId: "1:1", children: []}];
        const tabData = [
            {label: "Do", icon: "do", goalIds: [1]},
            ...["Be", "Feel", "Concern", "Who"].map(label => ({label, icon: "", goalIds: []})),
        ];
        const write = vi.fn();
        const close = vi.fn();
        const handle = {
            createWritable: vi.fn().mockResolvedValue({write, close}),
        };
        const setJsonFileHandle = vi.fn();

        fileContext.current = {
            setJsonFileHandle,
            treeData,
            tabData,
            goals: {1: {...treeData[0], content: "Updated text"}},
        };
        Object.defineProperty(window, "showSaveFilePicker", {
            configurable: true,
            value: vi.fn().mockResolvedValue(handle),
        });

        render(<SaveFileButton/>);
        fireEvent.click(screen.getByRole("button", {name: "Save"}));

        await waitFor(() => {
            expect(write).toHaveBeenCalledWith(JSON.stringify({tabData, treeData: [{...treeData[0], content: "Updated text"}]}));
        });
        expect(close).toHaveBeenCalledOnce();
        expect(setJsonFileHandle).toHaveBeenCalledWith(handle);
    });

    it("does not open a file when model data is inconsistent", async () => {
        const picker = vi.fn();
        Object.defineProperty(window, "showSaveFilePicker", {configurable: true, value: picker});
        fileContext.current = {
            setJsonFileHandle: vi.fn(),
            treeData: [{id: 2, content: "Missing", type: "Do", instanceId: "2:1"}],
            tabData: [],
            goals: {1: {content: "Existing goal"}},
        };
        render(<SaveFileButton/>);
        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        expect(await screen.findByText("Cannot save: goal 2 is missing from the model.")).toBeTruthy();
        expect(picker).not.toHaveBeenCalled();
    });

    it.each(["cancel", "write error"])("handles %s without recording a saved file", async failure => {
        const setJsonFileHandle = vi.fn();
        const abort = vi.fn().mockResolvedValue(undefined);
        const close = vi.fn();
        const picker = failure === "cancel"
            ? vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"))
            : vi.fn().mockResolvedValue({createWritable: async () => ({
                write: vi.fn().mockRejectedValue(new Error("Disk write failed")), close, abort,
            })});
        Object.defineProperty(window, "showSaveFilePicker", {configurable: true, value: picker});
        const goal = {id: 1, content: "Root", type: "Do", instanceId: "1:1"};
        fileContext.current = {
            setJsonFileHandle, treeData: [goal], goals: {1: goal},
            tabData: ["Do", "Be", "Feel", "Concern", "Who"].map(label => ({
                label, icon: "", goalIds: label === "Do" ? [1] : [],
            })),
        };
        render(<SaveFileButton/>);
        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        if (failure === "write error") {
            expect(await screen.findByText("Disk write failed")).toBeTruthy();
            expect(abort).toHaveBeenCalledOnce();
            expect(close).not.toHaveBeenCalled();
        } else {
            await waitFor(() => expect(picker).toHaveBeenCalledOnce());
            expect(screen.queryByRole("dialog")).toBeNull();
        }
        expect(setJsonFileHandle).not.toHaveBeenCalled();
    });
});
