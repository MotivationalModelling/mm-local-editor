export function isEmptyGoal(goal: { content: string }): boolean {
  return goal.content.trim() === "";
}

export function isTextEmpty(input: string): boolean {
  return input.trim() === "";
}

// Check if editing should be allowed (prevent editing empty goals)
// FIX #254: this function is no longer called in Tree.tsx to gate handleEdit/handleDoubleClick —
// empty goals created via drag-and-drop must be editable immediately.
// It is kept here because it is still used elsewhere (e.g. isGoalDraggable, SectionPanel).
export function canEditGoal(goal: { content: string }): boolean {
  return !isEmptyGoal(goal);
}

// Validate if save should be allowed (prevent saving empty content to existing goals)
// FIX #254: the original second clause was dead code —
//   (isTextEmpty(originalContent) && !isTextEmpty(newContent))
// If !isTextEmpty(newContent) is true the first clause already returns true.
// If !isTextEmpty(newContent) is false the second clause is also false.
// Simplified to just !isTextEmpty(newContent), which is the correct intended behaviour.
export function canSaveContentEdit(originalContent: string, newContent: string): boolean {
  // Allow save if:
  // 1. New content is not empty, OR
  // 2. Original content was empty (initial entry)
  void originalContent; // originalContent is intentionally unused — see comment above
  return !isTextEmpty(newContent);
}

// Handle content edit save with validation
export function handleContentSave(
  originalContent: string,
  newContent: string,
  onSave: (content: string) => void,
  onCancel: () => void
): void {
  if (canSaveContentEdit(originalContent, newContent)) {
    onSave(newContent);
  } else {
    // If trying to save empty content to existing goal, cancel
    onCancel();
  }
}

// Handle key press events for goal editing
export function handleGoalKeyPress(
  event: React.KeyboardEvent<HTMLInputElement>,
  originalContent: string,
  currentContent: string,
  onSave: (content: string) => void,
  onCancel: () => void,
  onOtherKey?: (event: React.KeyboardEvent<HTMLInputElement>) => void
): void {
  if (event.key === "Enter") {
    // call input Onsave Function
    handleContentSave(originalContent, currentContent, onSave, onCancel);
  } else if (event.key === "Escape") {
    onCancel();
  } else if (onOtherKey) {
    onOtherKey(event);
  }
}

// Handle blur events for goal editing
export function handleGoalBlur(
  originalContent: string,
  currentContent: string,
  onSave: (content: string) => void,
  onCancel: () => void,
  shouldPreventBlur: boolean = false
): void {
  if (!shouldPreventBlur) {
    handleContentSave(originalContent, currentContent, onSave, onCancel);
  }
}

// Check if goal should be draggable
export function isGoalDraggable(goal: { content: string }): boolean {
  return !isEmptyGoal(goal);
}
