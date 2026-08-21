import React, {createContext, PropsWithChildren, useContext, useReducer} from "react";

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

type UserStoriesAction =
  | {type: "SET_LOADING"}
  | {type: "SET_SUCCESS"; payload: {rawOutput: string; stories: UserStory[]}}
  | {type: "SET_ERROR"; payload: string}
  | {type: "APPROVE"; payload: string}
  | {type: "REJECT"; payload: string}
  | {type: "EDIT"; payload: {id: string; text: string}}
  | {type: "CLEAR"};

const initialState: UserStoriesState = {
  stories: [],
  rawOutput: "",
  status: "idle",
  error: null,
};

const reducer = (state: UserStoriesState, action: UserStoriesAction): UserStoriesState => {
  if (action.type === "SET_LOADING") {
    return {...state, status: "loading", error: null};
  }
  if (action.type === "SET_SUCCESS") {
    return {
      ...state,
      status: "success",
      rawOutput: action.payload.rawOutput,
      stories: action.payload.stories,
      error: null,
    };
  }
  if (action.type === "SET_ERROR") {
    return {...state, status: "error", error: action.payload};
  }
  if (action.type === "APPROVE") {
    return {
      ...state,
      stories: state.stories.map((s) => (s.id === action.payload ? {...s, status: "approved"} : s)),
    };
  }
  if (action.type === "REJECT") {
    return {
      ...state,
      stories: state.stories.map((s) => (s.id === action.payload ? {...s, status: "rejected"} : s)),
    };
  }
  if (action.type === "EDIT") {
    return {
      ...state,
      stories: state.stories.map((s) =>
        s.id === action.payload.id ? {...s, editedText: action.payload.text, status: "edited"} : s
      ),
    };
  }
  if (action.type === "CLEAR") {
    return initialState;
  }
  return state;
};

type UserStoriesContextValue = {
  state: UserStoriesState;
  dispatch: React.Dispatch<UserStoriesAction>;
};

const UserStoriesContext = createContext<UserStoriesContextValue | null>(null);

export const useUserStories = (): UserStoriesContextValue => {
  const ctx = useContext(UserStoriesContext);
  if (!ctx) {
    throw new Error("useUserStories must be used within UserStoriesProvider.");
  }
  return ctx;
};

export function parseStoriesFromText(raw: string): UserStory[] {
  const blocks = raw
    .split(/\n(?=As a\s+)/g)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && b.startsWith("As a "));

  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trimEnd());
    const firstLine = (lines[0] ?? "").trim();

    const role = (() => {
      const m = firstLine.match(/^As a\s+(.*?),\s*I want/);
      return (m?.[1] ?? "").trim();
    })();

    const action = (() => {
      const m = firstLine.match(/I want to\s+(.*?)\s+so that/i);
      return (m?.[1] ?? "").trim();
    })();

    const qualityGoal = (() => {
      const m = firstLine.match(/so that\s+(.*?)\.\s*I want to feel/i);
      return (m?.[1] ?? "").trim();
    })();

    const emotionalGoal = (() => {
      const m = firstLine.match(/I want to feel\s+(.*?)(\.)?\s*$/i);
      return (m?.[1] ?? "").trim().replace(/\.$/, "");
    })();

    const subTasks = lines
      .slice(1)
      .map((l) => l.trimEnd())
      .filter((l) => l.startsWith("  - "))
      .map((l) => l.replace(/^ {2}-\s+/, "").trim())
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

export const UserStoriesProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <UserStoriesContext.Provider value={{state, dispatch}}>{children}</UserStoriesContext.Provider>;
};
