/** @vitest-environment jsdom */
import {useEffect} from "react";
import {cleanup, fireEvent, render, screen, within} from "@testing-library/react";
import {enableMapSet} from "immer";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import FileProvider, {LocalStorageType, useFileContext} from "./context/FileProvider";
import {deleteGoalReferenceFromHierarchy, moveTreeItem, updateTextForGoalId} from "./context/treeDataSlice";
import {UserStoriesProvider, useUserStories} from "./context/UserStoriesContext";
import UserStoriesPanel from "./UserStoriesPanel";
import {extractModelForPrompt} from "./utils/modelExtractor";
import {parseStoriesFromText} from "./utils/userStoryParser";
import type {TreeGoal} from "./types";
import {initialTabs} from "../data/initialTabs";

const goal = (id: number, content: string, children: TreeGoal[] = []): TreeGoal => ({
  id, instanceId: `${id}-1`, content, type: "Do", children,
});
const tree = [goal(1, "Learning platform", [
  {id: 2, instanceId: "2-1", type: "Who", content: "Student"},
  goal(10, "Question discovery", [goal(11, "Resources", [goal(12, "Access questions"), goal(13, "Curate lists")])]),
  goal(20, "Question contribution", [goal(21, "Post questions")]),
])];
const flatten = (nodes: TreeGoal[]): TreeGoal[] => nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
const model = extractModelForPrompt(tree);
const rawOutput = JSON.stringify({stories: model.stories.map((source) => ({
  functionalGoalInstanceId: source.functionalGoalInstanceId,
  sentence: `As a Student, I want to ${source.story.toLowerCase()} so that I can prepare for class.`,
  relatedGoalInstanceIds: source.goalReferences.map((ref) => ref.instanceId),
}))});
const stories = parseStoriesFromText(rawOutput, model);

const Harness = () => {
  const {dispatch, treeData, goals, treeIds} = useFileContext();
  const {state, dispatch: storyDispatch} = useUserStories();
  useEffect(() => {storyDispatch({type: "SET_SUCCESS", payload: {rawOutput, stories}});}, [storyDispatch]);
  return <>
    <UserStoriesPanel/>
    <button onClick={() => dispatch(moveTreeItem({id: 12, parentId: 20}))}>Move test leaf</button>
    <button onClick={() => dispatch(updateTextForGoalId({id: 10, text: "Renamed discovery"}))}>Rename test epic</button>
    <button onClick={() => dispatch(deleteGoalReferenceFromHierarchy(flatten(treeData).find((node) => node.id === 12)!))}>Remove test leaf</button>
    <output hidden data-testid="state">{JSON.stringify({treeData, goals, treeIds, stories: state.stories})}</output>
  </>;
};
const inspect = () => JSON.parse(screen.getByTestId("state").textContent!);
const mount = () => render(<FileProvider><UserStoriesProvider><Harness/></UserStoriesProvider></FileProvider>);
const writeStory = (action = "review new questions") => {
  fireEvent.input(screen.getByRole("textbox", {name: "Role"}), {target: {textContent: "Student"}});
  fireEvent.input(screen.getByRole("textbox", {name: "Action"}), {target: {textContent: action}});
  fireEvent.input(screen.getByRole("textbox", {name: "Business value"}), {target: {textContent: "I can practise"}});
  fireEvent.click(screen.getByRole("button", {name: "Link goals"}));
};

beforeEach(() => {
  enableMapSet();
  vi.spyOn(console, "log").mockImplementation(() => {});
  localStorage.clear();
  localStorage.setItem(LocalStorageType.TREE, JSON.stringify(tree));
  localStorage.setItem(LocalStorageType.TAB, JSON.stringify(initialTabs.map((tab) => ({
    ...tab, rows: flatten(tree).filter((node) => node.type === tab.label),
  }))));
});
afterEach(() => {cleanup(); localStorage.clear(); vi.restoreAllMocks();});

describe("epic user story interface", () => {
  it("groups nested leaves, updates approvals and supports individual and global collapse", () => {
    mount();
    expect(screen.getByText("2 epics · 3 user stories")).toBeTruthy();
    const discovery = screen.getByRole("region", {name: "Question discovery"});
    const contribution = screen.getByRole("region", {name: "Question contribution"});
    expect(discovery.querySelectorAll(".user-story-card")).toHaveLength(2);
    expect(contribution.querySelectorAll(".user-story-card")).toHaveLength(1);
    fireEvent.click(within(discovery).getAllByRole("button", {name: "Approve"})[0]);
    expect(within(discovery).getByText("1/2 approved")).toBeTruthy();
    expect(screen.getByText("Approved: 1 / 3")).toBeTruthy();
    expect(inspect().stories[0].sentence).toBe(stories[0].sentence);
    fireEvent.click(within(contribution).getByRole("button", {name: /EPIC Question contribution/}));
    expect(within(contribution).queryByRole("radio")).toBeNull();
    fireEvent.click(screen.getByRole("button", {name: "Expand all"}));
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", {name: "Collapse all"}));
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("creates an epic as a first-level model node with matching goal-list and instance references", () => {
    mount();
    fireEvent.click(screen.getByRole("button", {name: "Add epic"}));
    fireEvent.change(screen.getByLabelText("Epic name"), {target: {value: "Study progress"}});
    fireEvent.click(screen.getByRole("button", {name: "Create epic"}));
    const state = inspect();
    const epic = state.treeData[0].children.find((node: TreeGoal) => node.content === "Study progress");
    expect(epic.type).toBe("Do");
    expect(state.goals[epic.id].content).toBe("Study progress");
    expect(state.treeIds[epic.id]).toEqual([epic.instanceId]);
    expect(screen.getByText("3 epics · 3 user stories")).toBeTruthy();
    expect(screen.getByRole("region", {name: "Study progress"}).querySelectorAll(".user-story-card")).toHaveLength(0);
  });

  it("adds a story and a new leaf under the chosen epic with inherited model references", () => {
    mount();
    fireEvent.click(screen.getByRole("button", {name: "Add story to Question contribution"}));
    writeStory();
    expect((screen.getByLabelText("Epic") as HTMLSelectElement).value).toBe("20-1");
    fireEvent.click(screen.getByRole("button", {name: "Create user story"}));
    const state = inspect();
    const story = state.stories[3];
    const epic = state.treeData[0].children.find((node: TreeGoal) => node.id === 20);
    const leaf = epic.children.find((node: TreeGoal) => node.instanceId === story.functionalGoalInstanceId);
    expect(leaf.content).toBe("review new questions");
    expect(story.epicInstanceId).toBe("20-1");
    expect(story.relatedGoals.map((ref: {instanceId: string}) => ref.instanceId)).toEqual([leaf.instanceId, "2-1"]);
    expect(screen.getByRole("region", {name: "Question contribution"}).querySelectorAll(".user-story-card")).toHaveLength(2);
    expect(screen.getByText("2 epics · 4 user stories")).toBeTruthy();
  });

  it("links to an existing leaf in the selected epic without adding or changing model nodes", () => {
    mount();
    const before = inspect().treeData;
    fireEvent.click(screen.getByRole("button", {name: "Add user story"}));
    writeStory("access questions");
    fireEvent.change(screen.getByLabelText("Epic"), {target: {value: "10-1"}});
    const goals = screen.getByLabelText("Functional goal");
    expect(within(goals).queryByRole("option", {name: "Post questions"})).toBeNull();
    fireEvent.change(goals, {target: {value: "12-1"}});
    fireEvent.click(screen.getByRole("button", {name: "Create user story"}));
    expect(inspect().treeData).toEqual(before);
    expect(inspect().stories[3]).toMatchObject({epicInstanceId: "10-1", functionalGoalInstanceId: "12-1"});
  });

  it("follows model moves and renames and preserves stories when their leaf is removed", () => {
    mount();
    fireEvent.click(screen.getByRole("button", {name: "Move test leaf"}));
    expect(screen.getByRole("region", {name: "Question discovery"}).querySelectorAll(".user-story-card")).toHaveLength(1);
    expect(screen.getByRole("region", {name: "Question contribution"}).querySelectorAll(".user-story-card")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", {name: "Rename test epic"}));
    expect(screen.getByRole("region", {name: "Renamed discovery"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: "Remove test leaf"}));
    const unlinked = screen.getByRole("region", {name: "Unlinked stories"});
    expect(unlinked.querySelector(".user-story-sentence")?.textContent).toBe(stories[0].sentence);
    expect(inspect().stories).toHaveLength(3);
  });
});
