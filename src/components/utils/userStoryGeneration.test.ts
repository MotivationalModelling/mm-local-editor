import {beforeEach, describe, expect, it, vi} from "vitest";
import {generateUserStories} from "./llmService";
import {extractModelForPrompt} from "./modelExtractor";
import {generateValidatedUserStories} from "./userStoryGeneration";
import type {TreeGoal} from "../types";

vi.mock("./llmService", () => ({generateUserStories: vi.fn()}));
const generate = vi.mocked(generateUserStories);
const goal = (id: number, type: TreeGoal["type"], content: string, children: TreeGoal[] = []): TreeGoal => (
  {id, instanceId: `${id}-1`, type, content, children}
);
const model = extractModelForPrompt([goal(1, "Do", "Platform", [
  goal(12, "Who", "Student"),
  goal(14, "Do", "AI support question checking"),
  goal(32, "Do", "View leaderboard"),
])]);
const background = "A platform where students check practice questions and view a leaderboard.";
const invalidSentences = [
  "As a Student, I want AI support question checking so that I can create high-quality, trusted questions and feel proud and motivated.",
  "As a Student, I want a fair and transparent leaderboard that motivates participation so that I feel engaged, connected, and proud of my involvement.",
];
const validSentences = [
  "As a Student, I want to check questions with AI support so that I can create high-quality, trusted questions and feel proud and motivated.",
  "As a Student, I want to view a fair and transparent leaderboard that motivates participation so that I feel engaged, connected, and proud of my involvement.",
];
const responses = (sentences: string[]) => model.stories.map((story, index) => ({
  functionalGoalInstanceId: story.functionalGoalInstanceId,
  relatedGoalInstanceIds: story.goalReferences.map((reference) => reference.instanceId),
  sentence: sentences[index],
}));
const validOutput = JSON.stringify({stories: responses(validSentences)});
const invalidOutput = JSON.stringify({stories: responses(invalidSentences)});

beforeEach(() => vi.resetAllMocks());

describe("generateValidatedUserStories", () => {
  it("returns valid output unchanged without a correction request", async () => {
    generate.mockResolvedValueOnce(validOutput);
    const result = await generateValidatedUserStories(model, background);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.rawOutput).toBe(validOutput);
    expect(result.stories.map((story) => story.sentence)).toEqual(validSentences);
  });

  it("corrects both reported noun-phrase failures and validates the complete response", async () => {
    generate.mockResolvedValueOnce(invalidOutput).mockResolvedValueOnce(validOutput);
    const result = await generateValidatedUserStories(model, background);
    expect(generate).toHaveBeenCalledTimes(2);
    const correction = generate.mock.calls[1][0];
    expect(correction).toContain(background);
    expect(correction).toContain('The story for "AI support question checking" must be a complete');
    expect(correction).toContain(JSON.stringify(invalidOutput));
    expect(correction).toContain("Check EVERY story");
    expect(result.rawOutput).toBe(validOutput);
    expect(result.stories.map((story) => story.sentence)).toEqual(validSentences);
    expect(result.stories.map((story) => story.relatedGoals.map((reference) => reference.instanceId)))
      .toEqual(responses(validSentences).map((story) => story.relatedGoalInstanceIds));
  });

  it("stops after one correction even if a later story still fails", async () => {
    const partiallyCorrected = JSON.stringify({stories: responses([validSentences[0], invalidSentences[1]])});
    generate.mockResolvedValueOnce(invalidOutput).mockResolvedValueOnce(partiallyCorrected);
    await expect(generateValidatedUserStories(model, background))
      .rejects.toThrow('after one automatic correction attempt. The story for "View leaderboard"');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it.each(["roles", "references"])("still rejects invalid %s in a corrected response", async (field) => {
    const corrected = responses(validSentences);
    if (field === "roles") corrected[0].sentence = validSentences[0].replace("Student", "Teacher");
    else corrected[0].relatedGoalInstanceIds = ["14-1", "999-1"];
    generate.mockResolvedValueOnce(invalidOutput).mockResolvedValueOnce(JSON.stringify({stories: corrected}));
    await expect(generateValidatedUserStories(model, background))
      .rejects.toThrow(field === "roles" ? "associated roles" : "missing or unrelated goal instance IDs");
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("can correct malformed JSON", async () => {
    generate.mockResolvedValueOnce("not JSON").mockResolvedValueOnce(validOutput);
    expect((await generateValidatedUserStories(model, background)).rawOutput).toBe(validOutput);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("does not retry API errors", async () => {
    generate.mockRejectedValueOnce(new Error("Network unavailable"));
    await expect(generateValidatedUserStories(model, background)).rejects.toThrow("Network unavailable");
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("propagates a failed correction request without further retries", async () => {
    generate.mockResolvedValueOnce(invalidOutput).mockRejectedValueOnce(new Error("Rate limit exceeded"));
    await expect(generateValidatedUserStories(model, background)).rejects.toThrow("Rate limit exceeded");
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
