/** @vitest-environment jsdom */
import {act, cleanup, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";
import {parseStoriesFromText, UserStoriesProvider, useUserStories} from "./UserStoriesContext";
import {extractModelForPrompt} from "../utils/modelExtractor";
import {buildUserStoryPrompt} from "../utils/promptBuilder";
import {TreeGoal} from "../types";
import {getStoryText} from "../UserStoriesPanel";

const goal = (id: number, type: TreeGoal["type"], content: string, children: TreeGoal[] = []): TreeGoal => (
  {id, instanceId: `${id}-1`, type, content, children}
);
const model = extractModelForPrompt([goal(1, "Do", "Platform", [
  goal(2, "Who", "Student"),
  goal(3, "Who", "Teacher"),
  goal(4, "Be", "Accessible"),
  goal(5, "Feel", "Confident"),
  goal(6, "Concern", "Privacy"),
  goal(7, "Do", "Read questions"),
  goal(8, "Do", "Read questions", [goal(9, "Who", "Moderator")]),
])]);
const first = {
  functionalGoalInstanceId: "7-1",
  sentence: "As a Student and Teacher, I want to read questions so that I can review the available learning material.",
  relatedGoalInstanceIds: ["7-1", "2-1", "3-1", "4-1", "5-1", "6-1"],
};
const second = {
  ...first,
  functionalGoalInstanceId: "8-1",
  sentence: "As a Moderator, I want to read questions so that I can review the available learning material.",
  relatedGoalInstanceIds: ["8-1", "9-1", "4-1", "5-1", "6-1"],
};
const rawOutput = JSON.stringify({stories: [first, second]});
afterEach(cleanup);

describe("parseStoriesFromText", () => {
  it("accepts IDs copied directly from the prompt input for every functional goal", () => {
    const prompt = buildUserStoryPrompt(model, "A platform for reviewing learning material.");
    const input = JSON.parse(prompt.split("Functional goals:\n")[1].split("\n\n\nReturn only")[0]);
    const response = input.map((source: {functionalGoalInstanceId: string; relatedGoalInstanceIds: string[]}, index: number) => ({
      functionalGoalInstanceId: source.functionalGoalInstanceId,
      relatedGoalInstanceIds: source.relatedGoalInstanceIds,
      sentence: [first, second][index].sentence,
    }));
    const stories = parseStoriesFromText(JSON.stringify({stories: response}), model);
    expect(stories.map((story) => story.relatedGoals.map((goal) => goal.instanceId)))
      .toEqual(model.stories.map((source) => source.goalReferences.map((goal) => goal.instanceId)));
  });

  it("stores exact Do, all Who, Be, Feel and Concern references before rendering", () => {
    const [story] = parseStoriesFromText(rawOutput, model);
    expect(story).toMatchObject({
      role: "Student and Teacher",
      action: "read questions",
      immediateUserValue: "I can review the available learning material",
      sentence: first.sentence,
      functionalGoalInstanceId: "7-1",
      subTasks: [],
      relatedGoals: [
        {goalId: 7, instanceId: "7-1", type: "Do"},
        {goalId: 2, instanceId: "2-1", type: "Who"},
        {goalId: 3, instanceId: "3-1", type: "Who"},
        {goalId: 4, instanceId: "4-1", type: "Be"},
        {goalId: 5, instanceId: "5-1", type: "Feel"},
        {goalId: 6, instanceId: "6-1", type: "Concern"},
      ],
    });
  });

  it("matches reordered stories with identical actions by instance ID, not text or order", () => {
    const stories = parseStoriesFromText(JSON.stringify({stories: [second, first]}), model);
    expect(stories.map((story) => [story.functionalGoalInstanceId, story.role])).toEqual([
      ["7-1", "Student and Teacher"], ["8-1", "Moderator"],
    ]);
  });

  it("accepts fenced JSON and preserves punctuation inside the benefit", () => {
    const sentence = "As a Student and Teacher, I want to read questions so that I can review version 2.5 of the material.";
    const raw = '```json\n' + JSON.stringify({stories: [{...first, sentence}, second]}) + '\n```';
    const [story] = parseStoriesFromText(raw, model);
    expect(story.immediateUserValue).toBe("I can review version 2.5 of the material");
    expect(getStoryText(story)).toBe(sentence);
  });

  it("extracts wrapped clauses while preserving the original sentence for display and export", () => {
    const sentence = "As a Student and Teacher, I want to read questions, comments, and replies so that\nI can review the available material.";
    const [story] = parseStoriesFromText(JSON.stringify({stories: [{...first, sentence}, second]}), model);
    expect(story.role).toBe("Student and Teacher");
    expect(story.action).toBe("read questions, comments, and replies");
    expect(story.immediateUserValue).toBe("I can review the available material");
    expect(getStoryText(story)).toBe(sentence);
    expect(getStoryText({...story, editedText: "My edited sentence."})).toBe("My edited sentence.");
    expect(story.relatedGoals.map((goal) => goal.instanceId)).toEqual(first.relatedGoalInstanceIds);
  });

  it("preserves As an instead of rebuilding it as As a", () => {
    const editorModel = extractModelForPrompt([goal(1, "Do", "Platform", [goal(2, "Who", "Editor"), goal(7, "Do", "Read questions")])]);
    const sentence = "As an Editor, I want to read questions so that I can review the available material.";
    const [story] = parseStoriesFromText(JSON.stringify({stories: [{...first, sentence, relatedGoalInstanceIds: ["7-1", "2-1"]}]}), editorModel);
    expect(story.role).toBe("Editor");
    expect(getStoryText(story)).toBe(sentence);
  });

  it.each([
    "read questions",
    "As a Student and Teacher, I want to read questions.",
    "As a Student and Teacher, I want to read questions so that .",
    "As a Student and Teacher, I want to so that I can learn.",
  ])("rejects incomplete story sentences: %s", (sentence) => {
    expect(() => parseStoriesFromText(JSON.stringify({stories: [{...first, sentence}, second]}), model)).toThrow("complete");
  });

  it.each([
    ["missing Who", ["7-1", "4-1", "5-1", "6-1"]],
    ["missing one Who", ["7-1", "2-1", "4-1", "5-1", "6-1"]],
    ["missing Concern", ["7-1", "2-1", "3-1", "4-1", "5-1"]],
    ["wrong instance of the same goal", ["7-1", "2-2", "3-1", "4-1", "5-1", "6-1"]],
    ["another branch's Who", ["7-1", "9-1", "3-1", "4-1", "5-1", "6-1"]],
    ["duplicate role ID", [...first.relatedGoalInstanceIds, "3-1"]],
    ["reordered IDs", [...first.relatedGoalInstanceIds].reverse()],
    ["invented ID", [...first.relatedGoalInstanceIds, "999-1"]],
  ])("rejects %s instead of saving incorrect highlights", (_name, ids) => {
    expect(() => parseStoriesFromText(JSON.stringify({stories: [{...first, relatedGoalInstanceIds: ids}, second]}), model))
      .toThrow("missing or unrelated goal instance IDs");
  });

  it("rejects missing, duplicate, and unknown functional goals", () => {
    for (const stories of [[first], [first, first], [first, {...second, functionalGoalInstanceId: "999-1"}]]) {
      expect(() => parseStoriesFromText(JSON.stringify({stories}), model)).toThrow();
    }
  });

  it("rejects roles from another branch", () => {
    expect(() => parseStoriesFromText(JSON.stringify({stories: [{...first, sentence: second.sentence}, second]}), model))
      .toThrow("associated roles");
  });

  it.each(["Student", "Teacher", "student and Teacher", "Student and Teacher and Moderator", "Student and Student"])(
    "rejects omitted, renamed, invented or repeated roles: %s", (role) => {
      const sentence = `As a ${role}, I want to read questions so that I can learn.`;
      expect(() => parseStoriesFromText(JSON.stringify({stories: [{...first, sentence}, second]}), model))
        .toThrow("all of its associated roles");
    }
  );

  it.each(["Teacher and Student", "Student and a Teacher", "Student, Teacher"])(
    "accepts all exact roles with natural list formatting: %s", (role) => {
      const sentence = `As a ${role}, I want to read questions so that I can learn.`;
      const [story] = parseStoriesFromText(JSON.stringify({stories: [{...first, sentence}, second]}), model);
      expect(story.sentence).toBe(sentence);
      expect(story.relatedGoals.map((goal) => goal.instanceId)).toEqual(first.relatedGoalInstanceIds);
    }
  );

  it("keeps role labels containing commas or and intact", () => {
    const roles = ["Research and Development", "Teacher, senior", "Student"];
    const customModel = extractModelForPrompt([goal(1, "Do", "Platform", [
      ...roles.map((role, index) => goal(index + 2, "Who", role)), goal(7, "Do", "Read questions"),
    ])]);
    const sentence = "As a Research and Development, Teacher, senior, and Student, I want to read questions so that I can learn.";
    const [story] = parseStoriesFromText(JSON.stringify({stories: [{
      ...first, sentence, relatedGoalInstanceIds: ["7-1", "2-1", "3-1", "4-1"],
    }]}), customModel);
    expect(story.sentence).toBe(sentence);
  });

  it("reports malformed or legacy text responses instead of producing stories without references", () => {
    for (const raw of ["As a Student and Teacher, I want to read questions so that I can learn.", "{", '{"stories":[{}]}']) {
      expect(() => parseStoriesFromText(raw, model)).toThrow();
    }
  });

  it("uses the generic user without inventing a Who reference when none exists", () => {
    const noRoleModel = extractModelForPrompt([goal(1, "Do", "Platform", [goal(7, "Do", "Read questions")])]);
    const [story] = parseStoriesFromText(JSON.stringify({stories: [{...first, sentence: "As a user, I want to read questions so that I can learn.", relatedGoalInstanceIds: ["7-1"]}]}), noRoleModel);
    expect(story.relatedGoals).toEqual([{goalId: 7, instanceId: "7-1", type: "Do"}]);
  });
});

describe("UserStoriesProvider selection", () => {
  it("retains references while editing, approving and rejecting, and clears selection on regeneration", () => {
    const {result} = renderHook(useUserStories, {wrapper: UserStoriesProvider});
    const stories = parseStoriesFromText(rawOutput, model);
    act(() => result.current.dispatch({type: "SET_SUCCESS", payload: {rawOutput, stories}}));
    act(() => result.current.dispatch({type: "SELECT", payload: stories[0].id}));
    expect(result.current.state.selectedStoryId).toBe(stories[0].id);
    act(() => result.current.dispatch({type: "EDIT", payload: {id: stories[0].id, edits: {role: "Student and Teacher", action: "read the updated questions", immediateUserValue: "I can prepare for class"}}}));
    act(() => result.current.dispatch({type: "APPROVE", payload: stories[0].id}));
    act(() => result.current.dispatch({type: "REJECT", payload: stories[0].id}));
    expect(result.current.state.stories[0].relatedGoals).toEqual(stories[0].relatedGoals);
    act(() => result.current.dispatch({type: "SET_LOADING"}));
    expect(result.current.state.selectedStoryId).toBeNull();
    act(() => result.current.dispatch({type: "SET_SUCCESS", payload: {rawOutput, stories}}));
    act(() => result.current.dispatch({type: "SELECT", payload: stories[1].id}));
    act(() => result.current.dispatch({type: "SELECT", payload: "unknown"}));
    expect(result.current.state.selectedStoryId).toBe(stories[1].id);
    act(() => result.current.dispatch({type: "SELECT", payload: null}));
    expect(result.current.state.selectedStoryId).toBeNull();
    act(() => result.current.dispatch({type: "SELECT", payload: stories[0].id}));
    act(() => result.current.dispatch({type: "CLEAR"}));
    expect(result.current.state.selectedStoryId).toBeNull();
    expect(result.current.state.stories).toEqual([]);
  });
});
