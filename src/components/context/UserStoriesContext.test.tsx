import {describe, expect, it} from "vitest";

import {parseStoriesFromText} from "./UserStoriesContext";

describe("parseStoriesFromText", () => {
  it("parses the required one-sentence user story format", () => {
    const [story] = parseStoriesFromText(
      "As a Student, I want to access posted questions so that I can review available learning material."
    );

    expect(story).toMatchObject({
      role: "Student",
      action: "access posted questions",
      immediateUserValue: "I can review available learning material",
      subTasks: [],
    });
  });

  it("handles line wrapping and ignores content after the first sentence", () => {
    const [story] = parseStoriesFromText(
      "As a Student, I want to access posted questions so that\nI can review available learning material. I want to feel Confident."
    );

    expect(story).toMatchObject({
      role: "Student",
      action: "access posted questions",
      immediateUserValue: "I can review available learning material",
    });
  });
});
