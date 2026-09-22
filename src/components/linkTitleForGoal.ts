import {TreeGoal} from "./types.ts";

export const linkTitleForGoal = (goal: TreeGoal | null) =>
	`Link for ${goal?.content || "this goal"}`;
