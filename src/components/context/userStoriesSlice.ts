import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export type UserStory = {
  id: string;
  role: string;
  action: string;
  qualityGoal: string;
  emotionalGoal: string;
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
    const lines = block.split("\n").map((l) => l.trimEnd());
    const firstLine = (lines[0] ?? "").trim();

    const match = firstLine.match(
      /^As a\s+(.*?),\s*I want to\s+(.*?)\s+so that\s+(.*?)\.\s*I want to feel\s+(.*?)\.?\s*$/
    );

    const role = (match?.[1] ?? "").trim();
    const action = (match?.[2] ?? "").trim();
    const qualityGoal = (match?.[3] ?? "").trim();
    const emotionalGoal = (match?.[4] ?? "").trim();

    const subTasks = lines
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-") || l.startsWith("•") || l.startsWith("*") || l.startsWith("  -"))
      .map((l) => l.replace(/^(-|•|\*)\s+/, "").replace(/^-\s+/, "").trim())
      .filter((l) => l.length > 0);

    return {
      id: crypto.randomUUID(),
      role,
      action,
      qualityGoal,
      emotionalGoal,
      subTasks,
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

