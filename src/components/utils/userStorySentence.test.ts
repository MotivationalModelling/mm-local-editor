import {describe, expect, it} from "vitest";
import {applyUserStoryEdits, splitUserStorySentence} from "./userStorySentence";
import type {UserStory} from "../userStoryTypes";

const story: UserStory = {
  id: "story-1",
  sentence: "As an Editor, I want to review version 2.5 so that I can check the updates.",
  role: "Editor",
  action: "review version 2.5",
  immediateUserValue: "I can check the updates",
  subTasks: [],
  functionalGoalInstanceId: "1-1",
  relatedGoals: [{goalId: 1, instanceId: "1-1", type: "Do"}, {goalId: 2, instanceId: "2-1", type: "Who"}],
  status: "pending",
  editedText: "",
};

describe("user story clause editing", () => {
  it("keeps connectors and punctuation outside the editable clauses without changing the original sentence", () => {
    const parts = splitUserStorySentence(story.sentence)!;
    expect(parts).toEqual({
      prefix: "As an ", role: "Editor", actionPrefix: ", I want to ", action: "review version 2.5",
      valuePrefix: " so that ", immediateUserValue: "I can check the updates", suffix: ".",
    });
    expect(parts.prefix + parts.role + parts.actionPrefix + parts.action + parts.valuePrefix + parts.immediateUserValue + parts.suffix)
      .toBe(story.sentence);
  });

  it("updates all three fields and exported text while keeping the fixed words and source references", () => {
    const updated = applyUserStoryEdits(story, {
      role: " Author ", action: "review the latest version", immediateUserValue: "I can check the revised material",
    });
    expect(updated.role).toBe("Author");
    expect(updated.action).toBe("review the latest version");
    expect(updated.immediateUserValue).toBe("I can check the revised material");
    expect(updated.editedText).toBe("As an Author, I want to review the latest version so that I can check the revised material.");
    expect(updated.sentence).toBe(story.sentence);
    expect(updated.relatedGoals).toBe(story.relatedGoals);
    expect(updated.functionalGoalInstanceId).toBe(story.functionalGoalInstanceId);
    expect(updated.status).toBe("edited");
  });

  it.each(["role", "action", "immediateUserValue"] as const)("does not save an empty %s clause", (field) => {
    expect(applyUserStoryEdits(story, {...story, [field]: "  "})).toBe(story);
  });
});
