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

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("SaveFileButton", () => {
    it("exports the current tab and tree data as JSON", async () => {
        const treeData = [{id: 1, content: "Do", children: []}];
        const tabData = [{label: "Do", icon: "do", goalIds: [1]}];
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
            goals: {1: {content: "Do"}},
        };
        Object.defineProperty(window, "showSaveFilePicker", {
            configurable: true,
            value: vi.fn().mockResolvedValue(handle),
        });

        render(<SaveFileButton/>);
        fireEvent.click(screen.getByRole("button", {name: "Save"}));

        await waitFor(() => {
            expect(write).toHaveBeenCalledWith(JSON.stringify({tabData, treeData}));
        });
        expect(close).toHaveBeenCalledOnce();
        expect(setJsonFileHandle).toHaveBeenCalledWith(handle);
    });
});
