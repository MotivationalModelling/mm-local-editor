import type {UserStory, UserStoryEdits} from "../userStoryTypes";

export type UserStorySentenceParts = UserStoryEdits & {
  prefix: string;
  actionPrefix: string;
  valuePrefix: string;
  suffix: string;
};

// Keep the original connectors, article, whitespace and punctuation separate
// from the three editable clauses so rendering never has to rewrite AI text.
export function splitUserStorySentence(sentence: string): UserStorySentenceParts | null {
  const match = sentence.trim().match(/^(As\s+an?\s+)(.+?)(,\s*I\s+want\s+to\s+)(.+?)(\s+so\s+that\s+)(.+?)([.!?]?)$/is);
  if (!match) return null;
  const [, prefix, role, actionPrefix, action, valuePrefix, immediateUserValue, suffix] = match;
  if (![role, action, immediateUserValue].every((part) => part.replace(/[.!?]/g, "").trim())) return null;
  return {prefix, role, actionPrefix, action, valuePrefix, immediateUserValue, suffix};
}

export function applyUserStoryEdits(story: UserStory, edits: UserStoryEdits): UserStory {
  const parts = splitUserStorySentence(story.sentence);
  const role = edits.role.trim();
  const action = edits.action.trim();
  const immediateUserValue = edits.immediateUserValue.trim();
  if (!parts || !role || !action || !immediateUserValue) return story;
  return {
    ...story,
    role,
    action,
    immediateUserValue,
    editedText: `${parts.prefix}${role}${parts.actionPrefix}${action}${parts.valuePrefix}${immediateUserValue}${parts.suffix}`,
    status: "edited",
  };
}
