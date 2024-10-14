import { configureStore } from '@reduxjs/toolkit'
import treeReducer from "../components/features/treeReducer.ts";

export const store = configureStore({
    reducer: {
        tree: treeReducer
    }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch