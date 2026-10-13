import {describe, expect, it} from "vitest";
import type {TreeGoal} from "../types";
import {extractModelForPrompt, resolveModelTree} from "./modelExtractor";
import {parseStoriesFromText} from "./userStoryParser";
import {appendGoalToInstance, groupStoriesByEpic} from "./userStoryEpics";

const goal = (id: number, content: string, children: TreeGoal[] = []): TreeGoal => ({
  id, instanceId: `${id}-1`, content, type: "Do", children,
});
const firstEpic = goal(10, "Same epic title", [goal(11, "Intermediate group", [goal(12, "Read questions")])]);
const secondEpic = {...goal(10, "Same epic title", [goal(22, "Read questions")]), instanceId: "10-2" as const};
const tree = [goal(1, "Platform", [
  {id: 2, instanceId: "2-1", type: "Who", content: "Student"}, firstEpic, secondEpic,
])];
const model = extractModelForPrompt(tree);
const stories = parseStoriesFromText(JSON.stringify({stories: model.stories.map((source) => ({
  functionalGoalInstanceId: source.functionalGoalInstanceId,
  sentence: "As a Student, I want to read questions so that I can learn.",
  relatedGoalInstanceIds: source.goalReferences.map((ref) => ref.instanceId),
  epicInstanceId: "invented-epic",
})).reverse()}), model);

describe("model epic ownership", () => {
  it("uses first-level Do instances, keeping duplicate titles and deeper ancestors distinct", () => {
    expect(model.projectName).toBe("Platform");
    expect(model.epics.map((epic) => epic.instanceId)).toEqual(["10-1", "10-2"]);
    expect(model.stories.map((source) => [source.functionalGoalInstanceId, source.epicInstanceId]))
      .toEqual([["12-1", "10-1"], ["22-1", "10-2"]]);
    expect(stories.map((story) => story.epicInstanceId)).toEqual(["10-1", "10-2"]);
    expect(groupStoriesByEpic(model, stories).map((group) => group.stories[0].functionalGoalInstanceId))
      .toEqual(["12-1", "22-1"]);
  });

  it("reassigns a moved leaf from the current hierarchy while preserving its text and status", () => {
    const moved = [goal(1, "Platform", [
      goal(10, "Same epic title", [goal(13, "Another leaf")]),
      {...secondEpic, children: [goal(12, "Read questions"), ...(secondEpic.children ?? [])]},
    ])];
    const approved = {...stories[0], status: "approved" as const};
    const groups = groupStoriesByEpic(extractModelForPrompt(moved), [approved, stories[1]]);
    expect(groups[0].stories).toEqual([]);
    expect(groups[1].stories[0]).toBe(approved);
    expect(groups[1].stories[0].sentence).toBe(stories[0].sentence);
  });

  it("retains deleted or no-longer-leaf stories in an unlinked group", () => {
    const changed = appendGoalToInstance(tree, "12-1", goal(30, "New child"));
    const groups = groupStoriesByEpic(extractModelForPrompt(changed), stories);
    expect(groups[groups.length - 1]?.epic).toBeNull();
    expect(groups[groups.length - 1]?.stories).toEqual([stories[0]]);
    expect(groupStoriesByEpic(extractModelForPrompt([]), stories)[0].stories).toEqual(stories);
  });

  it("uses current goal names without losing instance identity, tree order or positions", () => {
    const resolved = resolveModelTree(tree, {10: {...firstEpic, content: "Renamed epic"}});
    expect(extractModelForPrompt(resolved).epics.map((epic) => epic.title)).toEqual(["Renamed epic", "Renamed epic"]);
    expect(resolved[0].children?.[1].instanceId).toBe("10-1");
    expect(firstEpic.content).toBe("Same epic title");
  });

  it("supports a first-level Do that is itself terminal, without treating attached qualities as stories", () => {
    const shallow = extractModelForPrompt([goal(1, "Platform", [goal(2, "Sign in", [
      {id: 3, instanceId: "3-1", type: "Be", content: "Secure"},
    ])])]);
    expect(shallow.epics).toHaveLength(1);
    expect(shallow.stories.map((source) => [source.functionalGoalInstanceId, source.epicInstanceId]))
      .toEqual([["2-1", "2-1"]]);
  });
});
