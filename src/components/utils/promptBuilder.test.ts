import {describe, expect, it} from "vitest";

import {ExtractedModel} from "./modelExtractor";
import {buildUserStoryPrompt} from "./promptBuilder";

describe("buildUserStoryPrompt", () => {
  it("places resolved context beside each leaf and contains no subtask instructions", () => {
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
          roles: ["Student"],
          subTasks: [],
          qualityGoals: ["Accessible"],
          emotionalGoals: ["Connected"],
        },
        {
          story: "Review engagement",
          roles: ["Teaching team"],
          subTasks: [],
          qualityGoals: ["Organized"],
          emotionalGoals: ["Supported"],
        },
      ],
    };

    const prompt = buildUserStoryPrompt(model);

    expect(prompt).toContain(
      "Story 1:\n  Functional goal: Post comment\n  Role: Student\n  Quality goals: Accessible\n  Emotional goals: Connected"
    );
    expect(prompt).toContain(
      "Story 2:\n  Functional goal: Review engagement\n  Role: Teaching team\n  Quality goals: Organized\n  Emotional goals: Supported"
    );
    expect(prompt.toLowerCase()).not.toContain("sub-task");
    expect(prompt.toLowerCase()).not.toContain("subtask");
  });

  it("renders unresolved per-story context as blank fields", () => {
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
          roles: [],
          subTasks: [],
          qualityGoals: [],
          emotionalGoals: [],
        },
      ],
    };

    const prompt = buildUserStoryPrompt(model);

    expect(prompt).toContain(
      "Functional goal: Leaf action\n  Role: \n  Quality goals: \n  Emotional goals: "
    );
  });
});
