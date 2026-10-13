import {describe, expect, it} from "vitest";
import type {TreeGoal} from "../types";
import {extractModelForPrompt} from "./modelExtractor";
import {buildUserStoryPrompt} from "./promptBuilder";

const goal = (id: number, content: string, type: TreeGoal["type"], children: TreeGoal[] = []): TreeGoal => ({
  id, content, type, instanceId: `${id}-1`, children,
});
const tree = [
  {...goal(1, "Learning platform", "Do", [
    goal(2, "Student", "Who"),
    goal(3, "Accessible", "Be"),
    goal(4, "Connected", "Feel"),
    goal(5, "Discussion", "Do", [
      goal(6, "Tutor", "Who"),
      goal(7, "Post comment", "Do", [goal(8, "Privacy", "Concern")]),
    ]),
    goal(9, "Review engagement", "Do", [
      goal(10, "Teaching team", "Who"),
      goal(11, "Organized", "Be"),
      goal(12, "Supported", "Feel"),
    ]),
  ]), x: 100, y: 200, color: "red"},
];
const model = extractModelForPrompt(tree);
const background = "A university platform where students discuss course material with their teaching team.";
const readInput = (prompt: string) => JSON.parse(prompt.split("MODEL INPUT\n\n")[1]);

describe("buildUserStoryPrompt", () => {
  it("provides the complete hierarchy and resolved target leaf context with the requested business value rules", () => {
    const prompt = buildUserStoryPrompt(model, `  ${background}  `);
    expect(prompt).toContain("UNDERSTAND THE MOTIVATIONAL MODEL:");
    expect(prompt).toContain("Generate exactly one user story for each provided functional leaf goal.");
    expect(prompt).toContain("Use every role exactly as written in the provided Roles List.");
    expect(prompt).toContain("If multiple roles are provided, include all of them in the same user story.");
    expect(prompt).toContain("Inheritance is cumulative:");
    expect(prompt).toContain("Do not inherit from siblings or unrelated branches.");
    expect(prompt).toContain("STEP 3: GENERATE THE BUSINESS VALUE");
    expect(prompt).toContain("Business value may be a practical stakeholder benefit");
    expect(prompt).toContain("STEP 4: INCORPORATE QUALITY AND EMOTIONAL GOALS ONLY WHEN RELEVANT");
    expect(prompt).toContain('Copy `functionalGoalInstanceId` and `relatedGoalInstanceIds` exactly from the input');
    expect(prompt).not.toContain("immediate user value");

    const input = readInput(prompt);
    expect(input.projectBackground).toBe(background);
    const strip = (node: TreeGoal): unknown => ({
      instanceId: node.instanceId, type: node.type, content: node.content,
      children: (node.children ?? []).map(strip),
    });
    expect(input.motivationalModel).toEqual(tree.map(strip));
    expect(input.targetFunctionalLeafGoals).toEqual(model.stories.map((story) => ({
      functionalGoalInstanceId: story.functionalGoalInstanceId,
      "Functional goal": story.story,
      "Roles List": story.roles,
      "Quality goals": story.qualityGoals,
      "Emotional goals": story.emotionalGoals,
      Concerns: story.concerns,
      relatedGoalInstanceIds: story.goalReferences.map((goal) => goal.instanceId),
    })));
    expect(input.targetFunctionalLeafGoals[0]).toMatchObject({
      "Roles List": ["Student", "Tutor"],
      "Quality goals": ["Accessible"],
      "Emotional goals": ["Connected"],
      Concerns: ["Privacy"],
      relatedGoalInstanceIds: ["7-1", "2-1", "6-1", "3-1", "4-1", "8-1"],
    });
    expect(input.targetFunctionalLeafGoals[1]).toMatchObject({
      "Roles List": ["Student", "Teaching team"],
      "Quality goals": ["Accessible", "Organized"],
      "Emotional goals": ["Connected", "Supported"],
      Concerns: [],
    });
    expect(JSON.stringify(input)).not.toContain('"x":');
    expect(JSON.stringify(input)).not.toContain('"color":');
    expect(JSON.stringify(input)).not.toContain('"subTasks":');
  });

  it("retains the full model as context when generating only a selected subset of leaves", () => {
    const selected = {...model, stories: [model.stories[0]]};
    const prompt = buildUserStoryPrompt(selected, background);
    const input = readInput(prompt);
    expect(input.motivationalModel).toEqual(model.motivationalModel);
    expect(input.targetFunctionalLeafGoals.map((goal: {functionalGoalInstanceId: string}) => goal.functionalGoalInstanceId))
      .toEqual(["7-1"]);
    expect(prompt).toContain("Generate stories only for the functional leaf goals explicitly listed in `targetFunctionalLeafGoals`.");
  });

  it("renders absent per-story context as empty arrays", () => {
    const emptyContext = extractModelForPrompt([goal(1, "Platform", "Do", [goal(2, "Leaf action", "Do")])]);
    const input = readInput(buildUserStoryPrompt(emptyContext, "A project background."));
    expect(input.targetFunctionalLeafGoals).toEqual([{
      functionalGoalInstanceId: "2-1",
      "Functional goal": "Leaf action",
      "Roles List": [],
      "Quality goals": [],
      "Emotional goals": [],
      Concerns: [],
      relatedGoalInstanceIds: ["2-1"],
    }]);
  });

  it("requires a non-empty project background", () => {
    expect(() => buildUserStoryPrompt(model, "   ")).toThrow(
      "Project background is required to generate user stories."
    );
  });
});
