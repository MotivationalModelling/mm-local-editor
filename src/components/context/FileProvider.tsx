import React, {createContext, PropsWithChildren, useContext, useEffect, useReducer, useState} from "react";
import {createInitialState, treeDataSlice} from "./treeDataSlice.ts";
import {initialTabs} from "../../data/initialTabs.ts";
import {Cluster, ClusterGoal, GoalType, InstanceId, Label, TabContent, TreeGoal} from "../types.ts";
import useLocalStorage from "../utils/useLocalStorage.tsx"

// This hook manages the goals that are in use in the motivational model.
//
// The goals are made available to the app using two separate views of the
// goals themselves: one is a list of goals organised by type, the other is
// a tree of goals which the user has organised. Note that the goals
// organised by type contains all the goals; the tree may only contain some
// of the goals which the user has added to the hierarchy.
//
// To do this, we have a set of goals and then two data structures -- tabs and
// tree -- which just hold goal ids.
//
// Previously the code to manage and update these data structures was all done
// in-line and it was very hard to maintain and harder to test.


// Type of the json data
export type JSONData = {
    tabData: TabContent[];
    treeData: TreeGoal[];
};

export const DataType = {JSON: "AMMBER_JSON"};

export const LocalStorageType = {
    TREE: "ammber/treeData",
    TAB: "ammber/tabData",
};

// XXX this should be a Set
export const createTreeIdsFromTreeData = (goals: Record<TreeGoal["id"], TreeGoal>, treeData: TreeGoal[]): Record<TreeGoal["id"], InstanceId[]> => {
    const treeIds: Record<TreeGoal["id"], InstanceId[]> = Object.fromEntries(Object.keys(goals).map((goalId) => (
        [Number(goalId), []]
    )));
    const addInstanceIdsToTreeIds = (nodes: TreeGoal[]) => {
        nodes.forEach((node) => {
            if (treeIds[node.id]) {
                treeIds[node.id].push(node.instanceId);
            } else {
                throw new Error(`goal ${node.id} in tree but not in goal list`);
            }
            if (node.children && node.children.length > 0) {
                addInstanceIdsToTreeIds(node.children);
            }
        })
    };
    addInstanceIdsToTreeIds(treeData);
    return treeIds
};

export const createTabDataFromTabs = (goals: Record<TreeGoal["id"], TreeGoal>, tabs: Map<Label, TabContent>): TabContent[] => {
    // Convert Map<Label, TabContent> to TabContent[]
    // This ensures the tabData is properly derived from the Redux state
    return Array.from(tabs.values());
};

export const useFileContext = () => {
    const fileContext = useContext(FileContext);

    if (!fileContext) {
        throw new Error("useFileContext must be used within FileProvider.");
    }
    return fileContext;
};

// this bit of typescript takes the map of action names from the reducer slice and pulls
// out the payload type for use when typing dispatch. It also takes the slice's name and
// adds that to the action name to match RTK's action names.

type SliceActions<T, Name extends string> = {
    [K in keyof T]: {type: K extends string ? `${Name}/${K}` : K; payload: T[K] extends (...args: infer P) => void ? P[0] : never};
}[keyof T];

type DispatchActions = SliceActions<typeof treeDataSlice.actions, "treeData">

interface FileContextProps {
    jsonFileHandle: FileSystemFileHandle | null
    setJsonFileHandle: (jsonHandle: FileSystemFileHandle | null) => void
    tabData: TabContent[]
    treeData: TreeGoal[]
    cluster: Cluster
    xmlData: string
    dispatch: React.Dispatch<DispatchActions>
    setXmlData: (xmlData: string) => void
    tree: TreeGoal[]
    tabs: Map<Label, TabContent>
    goals: Record<TreeGoal["id"], TreeGoal>
    treeIds: Record<TreeGoal["id"], InstanceId[]>
}

// Create context for data tansfer and file handle
const FileContext = createContext<FileContextProps>({
    jsonFileHandle: null,
    setJsonFileHandle: () => { },
    tabData: [],
    treeData: [],
    cluster: {ClusterGoals: []},
    xmlData: "",
    dispatch: (() => { }) as React.Dispatch<DispatchActions>, // Fix: provide proper dispatch type
    // setTabData: () => {},
    // setTreeData: () => {},
    setXmlData: () => { },
    // resetData: () => {},
    tree: [],
    tabs: new Map(),
    goals: {},
    treeIds: {},
});

// Mapping of old types to new types
const typeMapping: Record<Label, GoalType> = {
    Who: "Stakeholder",
    Do: "Functional",
    Be: "Quality",
    Feel: "Emotional",
    Concern: "Negative",
};

// Convert the entire treeData into a cluster structure, to be sent to GraphWorker.
export const convertTreeDataToClusters = (treeData: TreeGoal[]): Cluster => {
    const convertTreeGoalToClusterGoal = (item: TreeGoal): ClusterGoal => {
        return {
            GoalID: item.id,
            instanceId: item.instanceId,
            GoalType: typeMapping[item.type],
            GoalContent: item.content,
            GoalNote: "",
            SubGoals: (item.children) ? item.children.map(convertTreeGoalToClusterGoal) : [],
            GoalColor: item.color,
            x: item.x,
            y: item.y,
        };
    };

    return {
        ClusterGoals: treeData.map(convertTreeGoalToClusterGoal),
    };
};

const FileProvider: React.FC<PropsWithChildren> = ({children}) => {
    // Load from localStorage
    const [storedTreeData, setStoredTreeData] = useLocalStorage<TreeGoal[]>(
        LocalStorageType.TREE,
        []
    );
    const [tabData, setTabData] = useLocalStorage<typeof initialTabs>(
        LocalStorageType.TAB,
        initialTabs
    );

    const initialState = createInitialState(tabData, storedTreeData);
    const [state, dispatch] = useReducer(treeDataSlice.reducer, initialState);
    const [jsonFileHandle, setJsonFileHandle] = useState<FileSystemFileHandle | null>(null);

    useEffect(() => {
        console.log("FileProvider state updated:", state);
    }, [state]);

    // Listen to changes in state and write back to localStorage
    useEffect(() => {
        setStoredTreeData(state.tree);

        // Convert Map<Label, TabContent> to InitialTab[] for storage
        const tabsArray: typeof initialTabs = Array.from(state.tabs.entries()).map(([label, tabContent]) => ({
            label,
            icon: tabContent.icon,
            rows: tabContent.goalIds.map(goalId => state.goals[goalId]).filter(Boolean),
        }));

        setTabData(tabsArray);
    }, [state.tree, state.tabs, state.goals, setStoredTreeData, setTabData]);

    const [xmlData, setXmlData] = useState("");

    const computedTabData = createTabDataFromTabs(state.goals, state.tabs);

    useEffect(() => {
        console.log("Tree data:", state.tree);
        console.log("Tab data:", computedTabData);
    }, [state.tree, computedTabData]);

    return (
        <FileContext.Provider value={{
            ...state,
            dispatch,
            treeData: state.tree,
            tabData: computedTabData,
            cluster: convertTreeDataToClusters(state.tree),
            xmlData,
            setXmlData,
            jsonFileHandle,
            setJsonFileHandle,
        }}>
            {children}
        </FileContext.Provider>
    );
};

export default FileProvider;
