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

    expect(model.epic).toBe("Online learning platform");
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

  it("resolves each leaf's role, quality goals and emotional goals independently", () => {
    const treeData: TreeGoal[] = [
      goal(1, "Platform", "Do", [
        goal(2, "Root role", "Who"),
        goal(3, "Root quality", "Be"),
        goal(4, "Root emotion", "Feel"),
        goal(5, "Feature group", "Do", [
          goal(6, "Group role", "Who"),
          goal(7, "Group emotion", "Feel"),
          goal(8, "Inherited leaf", "Do"),
          goal(9, "Partially overridden leaf", "Do", [
            goal(10, "Leaf quality", "Be"),
          ]),
          goal(11, "Fully overridden leaf", "Do", [
            goal(12, "Leaf role", "Who"),
            goal(13, "Leaf quality A", "Be"),
            goal(14, "Leaf quality B", "Be"),
            goal(15, "Leaf emotion", "Feel"),
          ]),
        ]),
      ]),
    ];

    expect(extractModelForPrompt(treeData).stories).toEqual([
      {
        story: "Inherited leaf",
        roles: ["Group role"],
        subTasks: [],
        qualityGoals: ["Root quality"],
        emotionalGoals: ["Group emotion"],
      },
      {
        story: "Partially overridden leaf",
        roles: ["Group role"],
        subTasks: [],
        qualityGoals: ["Leaf quality"],
        emotionalGoals: ["Group emotion"],
      },
      {
        story: "Fully overridden leaf",
        roles: ["Leaf role"],
        subTasks: [],
        qualityGoals: ["Leaf quality A", "Leaf quality B"],
        emotionalGoals: ["Leaf emotion"],
      },
    ]);
  });

  it("leaves a category empty when it cannot be found up to the epic", () => {
    const treeData: TreeGoal[] = [
      goal(1, "Platform", "Do", [goal(2, "Leaf action", "Do")]),
    ];

    expect(extractModelForPrompt(treeData).stories[0]).toMatchObject({
      roles: [],
      qualityGoals: [],
      emotionalGoals: [],
    });
  });
});
