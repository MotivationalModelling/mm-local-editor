import React, {createContext, PropsWithChildren, useContext, useReducer} from "react";

import type {UserStory, UserStoryEdits} from "../userStoryTypes";
import {applyUserStoryEdits} from "../utils/userStorySentence";
export type {UserStory, UserStoryGoalReference} from "../userStoryTypes";
export {parseStoriesFromText} from "../utils/userStoryParser";

type UserStoriesState = {
  stories: UserStory[];
  selectedStoryId: string | null;
  rawOutput: string;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
};

type UserStoriesAction =
  | {type: "SELECT"; payload: string | null}
  | {type: "SET_LOADING"}
  | {type: "SET_SUCCESS"; payload: {rawOutput: string; stories: UserStory[]}}
  | {type: "SET_ERROR"; payload: string}
  | {type: "APPROVE"; payload: string}
  | {type: "REJECT"; payload: string}
  | {type: "DELETE"; payload: string}
  | {type: "EDIT"; payload: {id: string; edits: UserStoryEdits}}
  | {type: "CLEAR"};

const initialState: UserStoriesState = {
  stories: [],
  selectedStoryId: null,
  rawOutput: "",
  status: "idle",
  error: null,
};

const reducer = (state: UserStoriesState, action: UserStoriesAction): UserStoriesState => {
  if (action.type === "SELECT") {
    if (action.payload !== null && !state.stories.some((story) => story.id === action.payload)) return state;
    return {...state, selectedStoryId: action.payload};
  }
  if (action.type === "SET_LOADING") {
    return {...state, status: "loading", error: null, selectedStoryId: null};
  }
  if (action.type === "SET_SUCCESS") {
    return {
      ...state,
      status: "success",
      rawOutput: action.payload.rawOutput,
      stories: action.payload.stories,
      selectedStoryId: null,
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
  if (action.type === "DELETE") {
    return {
      ...state,
      stories: state.stories.filter((story) => story.id !== action.payload),
      selectedStoryId: state.selectedStoryId === action.payload ? null : state.selectedStoryId,
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
        s.id === action.payload.id ? applyUserStoryEdits(s, action.payload.edits) : s
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

export const UserStoriesProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <UserStoriesContext.Provider value={{state, dispatch}}>{children}</UserStoriesContext.Provider>;
};
