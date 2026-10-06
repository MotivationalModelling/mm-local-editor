import type {TreeGoal} from "../types";

export const isGoalNameEmpty = (value: string): boolean => value.trim() === "";

export const isGoalEmpty = (goal: Pick<TreeGoal, "content">): boolean => isGoalNameEmpty(goal.content);
