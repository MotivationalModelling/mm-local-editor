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

    const prompt = buildUserStoryPrompt(
      model,
      "A university platform where students discuss course material with their teaching team."
    );

    expect(prompt.startsWith("You are generating Agile user stories from a motivational model.")).toBe(true);
    expect(prompt).toContain("Generate exactly one user story for each provided functional goal.");
    expect(prompt).toContain(
      "<project_background>\nA university platform where students discuss course material with their teaching team.\n</project_background>"
    );
    expect(prompt).toContain(
      "Infer the smallest, most direct user outcome that follows immediately from the functional goal in the project background."
    );
    expect(prompt).toContain("Do not add secondary, downstream, or speculative benefits.");
    expect(prompt).toContain(
      "Functional goal 1:\n  Goal: Post comment\n  Roles:\n    - Student\n  Quality goals:\n    - Accessible\n  Emotional goals:\n    - Connected"
    );
    expect(prompt).toContain(
      "Functional goal 2:\n  Goal: Review engagement\n  Roles:\n    - Teaching team\n  Quality goals:\n    - Organized\n  Emotional goals:\n    - Supported"
    );
    expect(
      prompt.endsWith(
        "Return only the generated user stories.\nReturn one user story per line, in the same order as the functional goals.\nEach output line must contain exactly one sentence in the REQUIRED OUTPUT FORMAT.\nDo not append another sentence or any additional content after the immediate user value.\nDo not include explanations, reasoning, headings, bullet points, or additional commentary."
      )
    ).toBe(true);
    expect(prompt).toContain(
      "As a <role>, I want to <functional goal> so that <immediate user value>."
    );
    expect(prompt).not.toContain("I want to feel");
    expect(prompt.toLowerCase()).not.toContain("sub-task");
    expect(prompt.toLowerCase()).not.toContain("subtask");
    expect(prompt).not.toContain("EXAMPLE INPUT");
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

    const prompt = buildUserStoryPrompt(model, "A project background.");

    expect(prompt).toContain(
      "Functional goal 1:\n  Goal: Leaf action\n  Roles:\n  Quality goals:\n  Emotional goals:\n"
    );
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
