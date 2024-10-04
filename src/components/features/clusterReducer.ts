import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../../app/store'
import {Cluster} from "../types.ts";

// Define a type for the slice state
interface ClusterState {
    cluster: Cluster | null
}

// Define the initial state using that type
const initialState: ClusterState = {
    cluster: null
};

export const clusterSlice = createSlice({
    name: 'cluster',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setCluster: (state, action: PayloadAction<Cluster | null>) => {
            state.cluster = action.payload;
        }
    }
});

export const {setCluster} = clusterSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectCluster = (state: RootState) => state.cluster;

export default clusterSlice.reducer;