/** @vitest-environment jsdom */
import {useEffect, useState} from "react";
import {cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import SectionPanel, {ProjectEditTab} from "./SectionPanel";
import {parseStoriesFromText, UserStoriesProvider, useUserStories} from "./context/UserStoriesContext";
import {extractModelForPrompt} from "./utils/modelExtractor";
import {TreeGoal} from "./types";

const goal = (id: number, type: TreeGoal["type"], content: string, children: TreeGoal[] = []): TreeGoal => (
  {id, instanceId: `${id}-1`, type, content, children}
);
const treeData = [goal(1, "Do", "Platform", [
  goal(2, "Who", "Student"), goal(3, "Be", "Accessible"),
  goal(4, "Feel", "Confident"), goal(5, "Concern", "Privacy"),
  goal(6, "Do", "Read questions"),
  goal(7, "Do", "Read questions", [goal(8, "Who", "Moderator")]),
])];
const flatten = (nodes: TreeGoal[]): TreeGoal[] => nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
const goals = Object.fromEntries(flatten(treeData).map((node) => [node.id, node]));
vi.mock("./context/FileProvider", () => ({
  useFileContext: () => ({
    treeData, tree: treeData, goals,
    treeIds: Object.fromEntries(flatten(treeData).map((node) => [node.id, [node.instanceId]])),
    tabs: new Map(),
    dispatch: vi.fn(),
  }),
}));
vi.mock("./Graphs/GraphWorker", () => ({default: () => <div>Model canvas</div>}));

const model = extractModelForPrompt(treeData);
const rawOutput = JSON.stringify({stories: model.stories.map((source) => ({
  functionalGoalInstanceId: source.functionalGoalInstanceId,
  sentence: `As a ${source.roles[0]}, I want to read questions so that I can review the available material.`,
  relatedGoalInstanceIds: source.goalReferences.map((reference) => reference.instanceId),
}))});
const stories = parseStoriesFromText(rawOutput, model);
const Editor = () => {
  const {dispatch} = useUserStories();
  const [activeTab, setActiveTab] = useState<ProjectEditTab>("stories");
  useEffect(() => {
    dispatch({type: "SET_SUCCESS", payload: {rawOutput, stories}});
  }, [dispatch]);
  return <SectionPanel activeTab={activeTab} onTabChange={setActiveTab}/>;
};
const highlightedIds = (container: HTMLElement) => Array.from(container.querySelectorAll(".tree-row--story-highlight"))
  .map((element) => element.getAttribute("data-instance-id")).sort();
afterEach(cleanup);

describe("selecting a user story", () => {
  it("deletes stories without selecting them and clears highlights when the selected story is deleted", async () => {
    const {container} = render(<UserStoriesProvider><Editor/></UserStoriesProvider>);
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".user-story-card"));
    fireEvent.click(within(cards[0]).getByRole("button", {name: "Approve"}));
    await waitFor(() => expect(highlightedIds(container)).toEqual(["2-1", "3-1", "4-1", "5-1", "6-1"]));

    fireEvent.click(within(cards[1]).getByRole("button", {name: "Delete"}));
    expect(container.querySelectorAll(".user-story-card")).toHaveLength(1);
    expect(highlightedIds(container)).toEqual(["2-1", "3-1", "4-1", "5-1", "6-1"]);
    expect(screen.getByText("Approved: 1 / 1")).toBeTruthy();

    fireEvent.click(within(cards[0]).getByRole("button", {name: "Edit"}));
    fireEvent.click(within(cards[0]).getByRole("button", {name: "Delete"}));
    expect(container.querySelectorAll(".user-story-card")).toHaveLength(0);
    expect(highlightedIds(container)).toEqual([]);
    expect(screen.queryByRole("button", {name: "Clear selection"})).toBeNull();
    expect(screen.getByText("Approved: 0 / 0")).toBeTruthy();
  });

  it("expands and highlights exact goal instances, switches and clears highlights, and retains links after editing", async () => {
    const {container} = render(<UserStoriesProvider><Editor/></UserStoriesProvider>);
    const radios = screen.getAllByRole("radio");
    expect(container.querySelector('[data-instance-id="6-1"]')).toBeNull();
    fireEvent.click(radios[0]);
    await waitFor(() => expect(highlightedIds(container)).toEqual(["2-1", "3-1", "4-1", "5-1", "6-1"]));
    expect(container.querySelector('[data-instance-id="1-1"]')?.classList.contains("tree-row--story-highlight")).toBe(false);

    fireEvent.click(radios[1]);
    await waitFor(() => expect(highlightedIds(container)).toEqual(["3-1", "4-1", "5-1", "7-1", "8-1"]));
    const selectedCard = container.querySelector(".user-story-card--selected") as HTMLElement;
    fireEvent.click(within(selectedCard).getByRole("button", {name: "Edit"}));
    expect(within(selectedCard).getAllByRole("textbox")).toHaveLength(3);
    expect(selectedCard.querySelector("textarea")).toBeNull();
    const fixedPhrases = Array.from(selectedCard.querySelectorAll(".user-story-phrase--fixed"));
    expect(fixedPhrases.map((phrase) => phrase.textContent)).toEqual(["As a ", ", I want to ", " so that ", "."]);
    expect(fixedPhrases.every((phrase) => phrase.getAttribute("contenteditable") === "false")).toBe(true);
    expect(within(selectedCard).getAllByRole("textbox").every((phrase) => phrase.tagName === "SPAN" && phrase.parentElement?.classList.contains("user-story-sentence"))).toBe(true);
    fireEvent.input(within(selectedCard).getByRole("textbox", {name: "Action"}), {target: {textContent: "read the updated questions"}});
    fireEvent.input(within(selectedCard).getByRole("textbox", {name: "Immediate user value"}), {target: {textContent: "I can prepare for class"}});
    fireEvent.click(within(selectedCard).getByRole("button", {name: "Save"}));
    expect(highlightedIds(container)).toEqual(["3-1", "4-1", "5-1", "7-1", "8-1"]);
    expect(selectedCard.querySelector(".user-story-sentence")?.textContent).toBe("As a Moderator, I want to read the updated questions so that I can prepare for class.");
    expect(selectedCard.querySelectorAll(".user-story-phrase--editable")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", {name: "Swap hierarchy and project details"}));
    expect(highlightedIds(container)).toEqual(["3-1", "4-1", "5-1", "7-1", "8-1"]);
    fireEvent.click(screen.getByRole("tab", {name: "Goals"}));
    expect(highlightedIds(container)).toEqual([]);
    fireEvent.click(screen.getByRole("tab", {name: "User stories"}));
    await waitFor(() => expect(highlightedIds(container)).toEqual(["3-1", "4-1", "5-1", "7-1", "8-1"]));
    fireEvent.click(screen.getByRole("button", {name: "Clear selection"}));
    expect(highlightedIds(container)).toEqual([]);

    fireEvent.click(within(container.querySelectorAll(".user-story-card")[0] as HTMLElement).getAllByText("read questions")[0]);
    await waitFor(() => expect(highlightedIds(container)).toEqual(["2-1", "3-1", "4-1", "5-1", "6-1"]));
  });
  it("reopens the saved clauses, rejects blank fields and discards cancelled changes", () => {
    const {container} = render(<UserStoriesProvider><Editor/></UserStoriesProvider>);
    const card = container.querySelector(".user-story-card") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", {name: "Edit"}));
    fireEvent.input(within(card).getByRole("textbox", {name: "Role"}), {target: {textContent: "Teaching assistant"}});
    fireEvent.input(within(card).getByRole("textbox", {name: "Action"}), {target: {textContent: "review questions"}});
    fireEvent.click(within(card).getByRole("button", {name: "Save"}));
    expect(card.querySelector(".user-story-sentence")?.textContent).toBe("As a Teaching assistant, I want to review questions so that I can review the available material.");
    fireEvent.click(within(card).getByRole("button", {name: "Edit"}));
    expect(within(card).getByRole("textbox", {name: "Role"}).textContent).toBe("Teaching assistant");
    expect(within(card).getByRole("textbox", {name: "Action"}).textContent).toBe("review questions");
    fireEvent.input(within(card).getByRole("textbox", {name: "Role"}), {target: {textContent: "   "}});
    expect((within(card).getByRole("button", {name: "Save"}) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(card).getByRole("button", {name: "Cancel"}));
    expect(card.querySelector(".user-story-sentence")?.textContent).toBe("As a Teaching assistant, I want to review questions so that I can review the available material.");
  });

  it("keeps the active text node while typing inline and restores the original sentence on Escape", () => {
    const {container} = render(<UserStoriesProvider><Editor/></UserStoriesProvider>);
    const card = container.querySelector(".user-story-card") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", {name: "Edit"}));
    const action = within(card).getByRole("textbox", {name: "Action"});
    expect(action.getAttribute("contenteditable")).toBe("plaintext-only");
    action.textContent = "review revised questions";
    const textNode = action.firstChild;
    fireEvent.input(action);
    expect(action.firstChild).toBe(textNode);
    expect(card.querySelector(".user-story-sentence")?.textContent).toBe("As a Student, I want to review revised questions so that I can review the available material.");
    fireEvent.keyDown(action, {key: "Escape"});
    expect(within(card).queryAllByRole("textbox")).toHaveLength(0);
    expect(card.querySelector(".user-story-sentence")?.textContent).toBe(stories[0].sentence);
  });

});
