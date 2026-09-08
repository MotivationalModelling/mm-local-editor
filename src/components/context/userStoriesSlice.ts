import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export type UserStory = {
  id: string;
  role: string;
  action: string;
  immediateUserValue: string;
  subTasks: string[];
  status: "pending" | "approved" | "rejected" | "edited";
  editedText: string;
};

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

export function parseStoriesFromText(raw: string): UserStory[] {
  const blocks = raw
    .split(/\n(?=As a\s+)/g)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && b.startsWith("As a "));

  return blocks.map((block) => {
    const storyText = block.replace(/\s+/g, " ").trim();

    const match = storyText.match(/^As a\s+(.*?),\s*I want to\s+(.*?)\s+so that\s+(.*?)\./);

    const role = (match?.[1] ?? "").trim();
    const action = (match?.[2] ?? "").trim();
    const immediateUserValue = (match?.[3] ?? "").trim();

    return {
      id: crypto.randomUUID(),
      role,
      action,
      immediateUserValue,
      subTasks: [],
      status: "pending",
      editedText: "",
    };
  });
}

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
    editStory: (state, action: PayloadAction<{id: string; text: string}>) => {
      const story = state.stories.find((s) => s.id === action.payload.id);
      if (story) {
        story.editedText = action.payload.text;
        story.status = "edited";
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
