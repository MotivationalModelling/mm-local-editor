import type {InstanceId, Label} from "./types";

export type UserStoryGoalReference = {
  goalId: number;
  instanceId: InstanceId;
  type: Label;
};

export type UserStory = {
  id: string;
  sentence: string;
  role: string;
  action: string;
  immediateUserValue: string;
  subTasks: string[];
  functionalGoalInstanceId: InstanceId;
  relatedGoals: UserStoryGoalReference[];
  status: "pending" | "approved" | "rejected" | "edited";
  editedText: string;
};

export type UserStoryEdits = Pick<UserStory, "role" | "action" | "immediateUserValue">;
