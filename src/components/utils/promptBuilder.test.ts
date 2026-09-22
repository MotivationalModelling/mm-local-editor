import {describe, expect, it} from "vitest";

import {ExtractedModel} from "./modelExtractor";
import {buildUserStoryPrompt} from "./promptBuilder";

describe("buildUserStoryPrompt", () => {
  it("uses the requested instructions and places resolved context under each functional goal", () => {
    const model: ExtractedModel = {
      epic: "Learning platform",
      roles: ["Student", "Teaching team"],
      functionalGoals: ["Post comment", "Review engagement"],
      qualityGoals: ["Accessible", "Organized"],
      emotionalGoals: ["Connected", "Supported"],
      concerns: [],
      stories: [
        {
          story: "Post comment",
          functionalGoalInstanceId: "2-1",
          concerns: ["Privacy"],
          goalReferences: [
            {goalId: 2, instanceId: "2-1", type: "Do", content: "Post comment"},
            {goalId: 3, instanceId: "3-1", type: "Who", content: "Student"},
            {goalId: 8, instanceId: "8-1", type: "Who", content: "Tutor"},
            {goalId: 4, instanceId: "4-1", type: "Be", content: "Accessible"},
            {goalId: 5, instanceId: "5-1", type: "Feel", content: "Connected"},
            {goalId: 6, instanceId: "6-1", type: "Concern", content: "Privacy"},
          ],
          roles: ["Student", "Tutor"],
          subTasks: [],
          qualityGoals: ["Accessible"],
          emotionalGoals: ["Connected"],
        },
        {
          story: "Review engagement",
          functionalGoalInstanceId: "7-1",
          concerns: [],
          goalReferences: [{goalId: 7, instanceId: "7-1", type: "Do", content: "Review engagement"}],
          roles: ["Teaching team"],
          subTasks: [],
          qualityGoals: ["Organized"],
          emotionalGoals: ["Supported"],
        },
      ],
    };

    const prompt = buildUserStoryPrompt(
      model,
      "A university platform where students discuss course material with their teaching team."
    );

    expect(prompt.startsWith("You are generating Agile user stories for a software project from a Motivational Model.")).toBe(true);
    expect(prompt).toContain("Generate exactly one user story for each functional goal.");
    expect(prompt).toContain("Use every role exactly as written in the provided Roles List.");
    expect(prompt).toContain("If multiple roles are provided, include all of them in the same user story.");
    expect(prompt).toContain("Generate the smallest and most direct user value that follows from performing the functional goal.");
    expect(prompt).toContain('Copy `functionalGoalInstanceId` and `relatedGoalInstanceIds` exactly from the input');
    expect(prompt).toContain("System:\nA university platform where students discuss course material with their teaching team.");
    expect(prompt).not.toContain(model.epic);
    expect(prompt).not.toContain("Select the most appropriate role");
    expect(prompt).not.toContain("Goal references");
    expect(prompt).not.toContain("subTasks");
    expect(prompt.endsWith("Return only the JSON object without Markdown fences or additional text.")).toBe(true);

    const input = JSON.parse(prompt.split("Functional goals:\n")[1].split("\n\n\nReturn only")[0]);
    expect(input).toEqual(model.stories.map((story) => ({
      functionalGoalInstanceId: story.functionalGoalInstanceId,
      "Functional goal": story.story,
      "Roles List": story.roles,
      "Quality goals": story.qualityGoals,
      "Emotional goals": story.emotionalGoals,
      Concerns: story.concerns,
      relatedGoalInstanceIds: story.goalReferences.map((goal) => goal.instanceId),
    })));
  });

  it("renders unresolved per-story context as empty arrays", () => {
    const model: ExtractedModel = {
      epic: "Platform",
      roles: [],
      functionalGoals: ["Leaf action"],
      qualityGoals: [],
      emotionalGoals: [],
      concerns: [],
      stories: [
        {
          story: "Leaf action",
          functionalGoalInstanceId: "2-1",
          concerns: [],
          goalReferences: [{goalId: 2, instanceId: "2-1", type: "Do", content: "Leaf action"}],
          roles: [],
          subTasks: [],
          qualityGoals: [],
          emotionalGoals: [],
        },
      ],
    };

    const prompt = buildUserStoryPrompt(model, "A project background.");

    const input = JSON.parse(prompt.split("Functional goals:\n")[1].split("\n\n\nReturn only")[0]);
    expect(input).toEqual([{
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
    const model: ExtractedModel = {
      epic: "Platform",
      roles: [],
      functionalGoals: [],
      qualityGoals: [],
      emotionalGoals: [],
      concerns: [],
      stories: [],
    };

    expect(() => buildUserStoryPrompt(model, "   ")).toThrow(
      "Project background is required to generate user stories."
    );
  });
});
