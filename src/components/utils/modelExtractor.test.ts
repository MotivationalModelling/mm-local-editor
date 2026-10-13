import {describe, expect, it} from "vitest";

import {TreeGoal} from "../types";
import {extractModelForPrompt} from "./modelExtractor";

const goal = (
  id: number,
  content: string,
  type: TreeGoal["type"],
  children: TreeGoal[] = []
): TreeGoal => ({
  id,
  content,
  type,
  instanceId: `${id}-1`,
  children,
});

describe("extractModelForPrompt", () => {
  it("uses every terminal Do node below the epic as a user story", () => {
    const treeData: TreeGoal[] = [
      goal(1, "Online learning platform", "Do", [
        goal(2, "Accessible", "Be"),
        goal(3, "Student profile", "Do", [
          goal(4, "Student", "Who"),
          goal(5, "Access posted questions", "Do"),
          goal(6, "Curate personal question lists", "Do"),
        ]),
        goal(7, "Engagement and community", "Do", [
          goal(8, "Encourage interaction", "Do", [
            goal(9, "Check, reply and like comments", "Do"),
            goal(10, "Post comment", "Do"),
          ]),
        ]),
      ]),
    ];

    const model = extractModelForPrompt(treeData);

    expect(model.projectName).toBe("Online learning platform");
    expect(model.stories.map(({story}) => story)).toEqual([
      "Access posted questions",
      "Curate personal question lists",
      "Check, reply and like comments",
      "Post comment",
    ]);
  });

  it("does not turn non-functional leaf nodes into user stories", () => {
    const treeData: TreeGoal[] = [
      goal(1, "Platform", "Do", [
        goal(2, "Student", "Who"),
        goal(3, "Secure", "Be"),
        goal(4, "Confident", "Feel"),
        goal(5, "Privacy", "Concern"),
        goal(6, "Sign in", "Do"),
      ]),
    ];

    expect(extractModelForPrompt(treeData).stories.map(({story}) => story)).toEqual(["Sign in"]);
  });

  it("accumulates all ancestor and local stakeholders, quality and emotional goals", () => {
    const treeData: TreeGoal[] = [
      goal(1, "Platform", "Do", [
        goal(2, "Root role", "Who"),
        goal(3, "Root quality", "Be"),
        goal(4, "Root emotion", "Feel"),
        goal(5, "Feature group", "Do", [
          goal(6, "Group role", "Who"),
          goal(7, "Group emotion", "Feel"),
          goal(8, "Inherited leaf", "Do"),
          goal(9, "Leaf with local quality", "Do", [
            goal(10, "Leaf quality", "Be"),
          ]),
          goal(11, "Leaf with local context", "Do", [
            goal(12, "Leaf role", "Who"),
            goal(13, "Leaf quality A", "Be"),
            goal(14, "Leaf quality B", "Be"),
            goal(15, "Leaf emotion", "Feel"),
          ]),
        ]),
      ]),
    ];

    expect(extractModelForPrompt(treeData).stories).toMatchObject([
      {
        story: "Inherited leaf",
        roles: ["Root role", "Group role"],
        subTasks: [],
        qualityGoals: ["Root quality"],
        emotionalGoals: ["Root emotion", "Group emotion"],
      },
      {
        story: "Leaf with local quality",
        roles: ["Root role", "Group role"],
        subTasks: [],
        qualityGoals: ["Root quality", "Leaf quality"],
        emotionalGoals: ["Root emotion", "Group emotion"],
      },
      {
        story: "Leaf with local context",
        roles: ["Root role", "Group role", "Leaf role"],
        subTasks: [],
        qualityGoals: ["Root quality", "Leaf quality A", "Leaf quality B"],
        emotionalGoals: ["Root emotion", "Group emotion", "Leaf emotion"],
      },
    ]);
  });

  it("leaves a category empty when no local or ancestor attachment exists", () => {
    const treeData: TreeGoal[] = [
      goal(1, "Platform", "Do", [goal(2, "Leaf action", "Do")]),
    ];

    expect(extractModelForPrompt(treeData).stories[0]).toMatchObject({
      roles: [],
      qualityGoals: [],
      emotionalGoals: [],
    });
  });
  it("preserves all goal instance IDs and resolves concerns without mixing branches", () => {
    const treeData = [goal(1, "Platform", "Do", [
      goal(2, "Student", "Who"),
      goal(3, "Accessible", "Be"),
      goal(4, "Confident", "Feel"),
      goal(5, "Privacy", "Concern"),
      goal(6, "Post comment", "Do"),
      goal(7, "Post comment", "Do", [
        {...goal(2, "Student", "Who"), instanceId: "2-2" as const},
        goal(8, "Local concern", "Concern"),
      ]),
    ])];
    const [first, second] = extractModelForPrompt(treeData).stories;
    expect(first.functionalGoalInstanceId).toBe("6-1");
    expect(first.goalReferences.map((ref) => ref.instanceId)).toEqual(["6-1", "2-1", "3-1", "4-1", "5-1"]);
    expect(second.functionalGoalInstanceId).toBe("7-1");
    expect(second.goalReferences.map((ref) => ref.instanceId)).toEqual(["7-1", "2-1", "2-2", "3-1", "4-1", "8-1"]);
    expect(second.concerns).toEqual(["Local concern"]);
    expect(second.roles).toEqual(["Student"]);
  });

  it("keeps inherited context inside its own branch and preserves every applicable instance", () => {
    const treeData = [goal(1, "Platform", "Do", [
      goal(2, "Root role", "Who"),
      goal(3, "Accessible", "Be"),
      goal(4, "Confident", "Feel"),
      goal(5, "Branch A", "Do", [
        goal(6, "Teacher", "Who"),
        {...goal(3, "Accessible", "Be"), instanceId: "3-2"},
        goal(7, "Supported", "Feel"),
        goal(8, "Read questions", "Do", [goal(9, "Student", "Who")]),
      ]),
      goal(10, "Branch B", "Do", [
        goal(11, "Moderator", "Who"),
        goal(12, "Organized", "Be"),
        goal(13, "Connected", "Feel"),
        goal(14, "Review comments", "Do"),
      ]),
    ])];
    const [first, second] = extractModelForPrompt(treeData).stories;
    expect(first.roles).toEqual(["Root role", "Teacher", "Student"]);
    expect(first.qualityGoals).toEqual(["Accessible"]);
    expect(first.emotionalGoals).toEqual(["Confident", "Supported"]);
    expect(first.goalReferences.map((ref) => ref.instanceId))
      .toEqual(["8-1", "2-1", "6-1", "9-1", "3-1", "3-2", "4-1", "7-1"]);
    expect(second.roles).toEqual(["Root role", "Moderator"]);
    expect(second.qualityGoals).toEqual(["Accessible", "Organized"]);
    expect(second.emotionalGoals).toEqual(["Confident", "Connected"]);
    expect(second.goalReferences.map((ref) => ref.instanceId))
      .toEqual(["14-1", "2-1", "11-1", "3-1", "12-1", "4-1", "13-1"]);
  });

});
