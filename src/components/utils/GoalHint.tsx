export function isEmptyGoal(goal: { content: string }): boolean {
  return goal.content.trim() === "";
}

export function isTextEmpty(input: string): boolean {
  return input.trim() === "";
}

// Check if editing should be allowed (prevent editing empty goals)
export function canEditGoal(goal: { content: string }): boolean {
  return !isEmptyGoal(goal);
}

// Validate if save should be allowed (prevent saving empty content)
// TODO: also validate that the goal name is not a duplicate at the same tree level
export function canSaveContentEdit(originalContent: string, newContent: string): boolean {
  void originalContent;
  return !isTextEmpty(newContent);
}

// Handle content edit save with validation
export function handleContentSave(
  originalContent: string,
  newContent: string,
  onSave: (content: string) => void,
  onCancel: () => void
): void {
  void onCancel;
  if (canSaveContentEdit(originalContent, newContent)) {
    onSave(newContent);
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
