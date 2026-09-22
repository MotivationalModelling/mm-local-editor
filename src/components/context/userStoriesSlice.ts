import {createSlice, PayloadAction} from "@reduxjs/toolkit";

import type {UserStory, UserStoryEdits} from "../userStoryTypes";
import {applyUserStoryEdits} from "../utils/userStorySentence";
export type {UserStory} from "../userStoryTypes";
export {parseStoriesFromText} from "../utils/userStoryParser";

type UserStoriesState = {
  stories: UserStory[];
  rawOutput: string;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
};

const initialState: UserStoriesState = {
  stories: [],
  rawOutput: "",
  status: "idle",
  error: null,
};

export const userStoriesSlice = createSlice({
  name: "userStories",
  initialState,
  reducers: {
    setStoriesLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setStoriesSuccess: (state, action: PayloadAction<{rawOutput: string; stories: UserStory[]}>) => {
      state.status = "success";
      state.rawOutput = action.payload.rawOutput;
      state.stories = action.payload.stories;
      state.error = null;
    },
    setStoriesError: (state, action: PayloadAction<string>) => {
      state.status = "error";
      state.error = action.payload;
    },
    approveStory: (state, action: PayloadAction<string>) => {
      const story = state.stories.find((s) => s.id === action.payload);
      if (story) {
        story.status = "approved";
      }
    },
    rejectStory: (state, action: PayloadAction<string>) => {
      const story = state.stories.find((s) => s.id === action.payload);
      if (story) {
        story.status = "rejected";
      }
    },
    editStory: (state, action: PayloadAction<{id: string; edits: UserStoryEdits}>) => {
      const story = state.stories.find((s) => s.id === action.payload.id);
      if (story) {
        Object.assign(story, applyUserStoryEdits(story, action.payload.edits));
      }
    },
    clearStories: () => initialState,
  },
});

export const {
  setStoriesLoading,
  setStoriesSuccess,
  setStoriesError,
  approveStory,
  rejectStory,
  editStory,
  clearStories,
} = userStoriesSlice.actions;
