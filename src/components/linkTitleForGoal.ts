import {TreeGoal} from "./utils/types.ts";

export const linkTitleForGoal = (goal: TreeGoal | null) =>
	`Link for ${goal?.content || "this goal"}`;
