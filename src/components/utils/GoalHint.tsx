export function isEmptyGoal(goal: { content: string }): boolean {
  return goal.content.trim() === "";
}
