/**
* @jest-environment jsdom
*/
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {useEffect, useRef} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {FeedbackProvider, useFeedbackContext} from "../context/FeedbackContext";
import {ProfileProvider} from "../context/ProfileContext";
import FeedbackPanel from "./FeedbackPanel";

vi.mock("./FeedbackAuthor", () => ({default: () => null}));
vi.mock("../Avatar", () => ({default: () => null}));

type Seed = {
    nodeId: string;
    nodeLabel?: string;
    content: string;
};

// Seeds feedback (and an optional selected node) through the real context so
// the panel is exercised against the same state it uses in the app.
const Harness = ({
    seed,
    selected,
}: {
    seed: Seed[];
    selected?: {nodeId: string; nodeLabel?: string};
}) => {
    const {addFeedback, setSelectedNode} = useFeedbackContext();
    const firstRun = useRef(true);

    useEffect(() => {
        if (!firstRun.current) {
            return;
        }

        firstRun.current = false;

        seed.forEach((item) => {
            addFeedback(item.nodeId, item.content, item.nodeLabel);
        });

        if (selected) {
            setSelectedNode(
                selected.nodeId,
                selected.nodeLabel ?? selected.nodeId
            );
        }
    }, [seed, selected, addFeedback, setSelectedNode]);

    return null;
};

const renderPanel = (options: {
    seed?: Seed[];
    selected?: {nodeId: string; nodeLabel?: string};
} = {}) => {
    const onClose = vi.fn();
    const onSelectNode = vi.fn();

    render(
        <ProfileProvider>
                <FeedbackProvider>
                    <Harness seed={options.seed ?? []} selected={options.selected} />
                    <FeedbackPanel onClose={onClose} onSelectNode={onSelectNode} />
                </FeedbackProvider>
        </ProfileProvider>
    );

    return {onClose, onSelectNode};
};

describe("FeedbackPanel", () => {
    afterEach(cleanup);

    beforeEach(() => {
        localStorage.clear();
    });

    it("limits overall feedback and blocks saving an overlong draft", () => {
        renderPanel();
        const input = screen.getByPlaceholderText("Feedback about the model as a whole...") as HTMLTextAreaElement;
        expect(input.maxLength).toBe(250);
        fireEvent.change(input, {target: {value: "字".repeat(250)}});
        expect(screen.getByText("250/250 characters")).toBeTruthy();
        expect((screen.getByRole("button", {name: "Save"}) as HTMLButtonElement).disabled).toBe(false);
        // Synthetic changes bypass the browser maxlength check; saving still rejects them.
        fireEvent.change(input, {target: {value: "字".repeat(251)}});
        expect((screen.getByRole("button", {name: "Save"}) as HTMLButtonElement).disabled).toBe(true);
    });

    it("limits node feedback and replies, including Enter submission", () => {
        renderPanel({seed: [{nodeId: "node", content: "Existing feedback"}], selected: {nodeId: "node"}});
        fireEvent.click(screen.getByRole("button", {name: "+ New Feedback"}));
        const input = screen.getByLabelText("New Feedback") as HTMLTextAreaElement;
        expect(input.maxLength).toBe(250);
        fireEvent.change(input, {target: {value: "x".repeat(251)}});
        expect((screen.getByRole("button", {name: "Add Feedback"}) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole("button", {name: "Reply"}));
        const reply = screen.getByPlaceholderText("Write a reply...") as HTMLInputElement;
        expect(reply.maxLength).toBe(250);
        fireEvent.change(reply, {target: {value: "x".repeat(251)}});
        expect((screen.getByRole("button", {name: "Send"}) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.keyDown(reply, {key: "Enter"});
        expect(reply.value).toHaveLength(251);
        fireEvent.change(reply, {target: {value: "x".repeat(250)}});
        fireEvent.keyDown(reply, {key: "Enter"});
        expect(reply.value).toBe("");
        expect(screen.getByText("x".repeat(250))).toBeTruthy();
    });

    it("lists all feedback when no node is selected", async () => {
        renderPanel({
            seed: [
                {
                    nodeId: "Functional-6-1",
                    nodeLabel: "Do1",
                    content: "Clarify the boundary of Do1."
                },
                {
                    nodeId: "Functional-7-1",
                    nodeLabel: "Do2",
                    content: "Explain the Do1 to Do2 link."
                }
            ]
        });

        expect(screen.getByText("All feedback")).toBeTruthy();
        expect(
            await screen.findByText("Clarify the boundary of Do1.")
        ).toBeTruthy();
        expect(screen.getByText("Explain the Do1 to Do2 link.")).toBeTruthy();
        expect(screen.queryByText(/Select a node/i)).toBeNull();
    });

    it("shows only the selected node's feedback when a node is selected", async () => {
        renderPanel({
            seed: [
                {
                    nodeId: "Functional-6-1",
                    nodeLabel: "Do1",
                    content: "Do1 feedback"
                },
                {
                    nodeId: "Functional-7-1",
                    nodeLabel: "Do2",
                    content: "Do2 feedback"
                }
            ],
            selected: {nodeId: "Functional-6-1", nodeLabel: "Do1"}
        });

        expect(await screen.findByText("Do1 feedback")).toBeTruthy();
        expect(screen.queryByText("Do2 feedback")).toBeNull();
        expect(screen.getByText("Attached to")).toBeTruthy();
    });

    it("calls onSelectNode with the node id when a card is clicked", async () => {
        const {onSelectNode} = renderPanel({
            seed: [
                {
                    nodeId: "Functional-7-1",
                    nodeLabel: "Do2",
                    content: "Explain the Do1 to Do2 link."
                }
            ]
        });

        fireEvent.click(
            await screen.findByText("Explain the Do1 to Do2 link.")
        );

        expect(onSelectNode).toHaveBeenCalledWith("Functional-7-1");
    });

    it("does not locate the node when a card button is clicked", async () => {
        const {onSelectNode} = renderPanel({
            seed: [
                {
                    nodeId: "Functional-6-1",
                    nodeLabel: "Do1",
                    content: "Do1 feedback"
                }
            ]
        });

        await screen.findByText("Do1 feedback");

        fireEvent.click(
            screen.getAllByRole("button", {name: "More feedback actions"})[0]
        );

        expect(onSelectNode).not.toHaveBeenCalled();
    });
});
