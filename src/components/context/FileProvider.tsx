import React, {createContext, PropsWithChildren, useContext, useEffect, useReducer, useState} from "react";
import {createInitialState, treeDataSlice} from "./treeDataSlice.ts";
import {initialTabs} from "../../data/initialTabs.ts";
import {Cluster, ClusterGoal, GoalType} from "../types.ts";
import useLocalStorage from "../utils/useLocalStorage.tsx"
import { Label,newTreeItem,TreeItem,TreeNode,TabContent } from "../../data/dataModels.ts";

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
    treeData: TreeItem[];
};

type InstanceId = `${number}-${number}`

// Type of the tree item content
export type TreeItem = {
    id: number;
    content: string;
    type: Label;
    instanceId: InstanceId;
    children?: TreeItem[];
    color?: string;
};

// Define the structure for the content of each tab
export type TabContent = {
    label: Label
    icon: string
    goalIds: TreeItem["id"][]
}

// // Define the initial tabs with labels and corresponding icons
// export const tabs: TabContent[] = [
//     {label: "Do", icon: DoIcon, rows: []},
//     {label: "Be", icon: BeIcon, rows: []},
//     {label: "Feel", icon: FeelIcon, rows: []},
//     {label: "Concern", icon: ConcernIcon, rows: []},
//     {label: "Who", icon: WhoIcon, rows: []},
// ];
//
// export const initialTabs = tabs.map((tab, index) => ({
//     ...tab,
//     rows: [
//         ...tab.rows,
//         {
//             id: Date.now() + index,
//             type: tab.label,
//             content: "",
//         },
//     ]
// }));
export type Label = "Do" | "Be" | "Feel" | "Concern" | "Who";

export const NON_FUNCTIONAL_GOAL_TYPES = ["Be", "Feel", "Concern", "Who"] as const;

export type NonFunctionalGoalType = (typeof NON_FUNCTIONAL_GOAL_TYPES)[number];

export const isNonFunctionalGoal = (
  label: Label | undefined
): label is NonFunctionalGoalType =>
  NON_FUNCTIONAL_GOAL_TYPES.includes(label as NonFunctionalGoalType);

export const DataType = {JSON: "AMMBER_JSON"};

export const LocalStorageType = {
    TREE: "ammber/treeData",
    TAB: "ammber/tabData",
};

// XXX this should be a Set
export const createTreeIdsFromTreeData = (treeData: TreeItem[]): Record<TreeItem["id"], TreeItem["instanceId"][]> => {
    const treeIds: Record<TreeItem["id"], TreeItem["instanceId"][]> = {}
    // inner function
    const accumulate = (nodes: TreeItem[]) => {
        nodes.forEach((node) => {
            if (!treeIds[node.id]) {
                treeIds[node.id] = [];
            }
            treeIds[node.id].push(node.instanceId)
            if (node.children && node.children.length > 0) {
                accumulate(node.children);
            }
        })
    };
    accumulate(treeData);
    return treeIds
};




export const createTreeDataFromTreeNode = (goals: Record<TreeItem["id"], TreeItem>, treeNode: TreeNode[]): TreeItem[] => {
    return treeNode.map((tn) => {
        const goal = goals[tn.goalId];
        return newTreeItem({
            ...goal,
            instanceId: tn.instanceId,
            ...(tn.children) ? {children: createTreeDataFromTreeNode(goals, tn.children)} : {},
            color: tn.color
        });
    });
};

export const createTabDataFromTabs = (goals: Record<TreeItem["id"], TreeItem>, tabs: Map<Label, TabContent>): TabContent[] => {
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
    treeData: TreeItem[]
    cluster: Cluster
    xmlData: string
    dispatch: React.Dispatch<DispatchActions>
    // setTabData: (tabData: TabContent[]) => void;
    // setTreeData: (jsonData: TreeItem[]) => void;
    setXmlData: (xmlData: string) => void
    // resetData: () => void;
    tree: TreeNode[]
    tabs: Map<Label, TabContent>
    goals: Record<TreeItem["id"], TreeItem>
    treeIds: Record<TreeItem["id"], TreeItem["instanceId"][]>
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
export const convertTreeDataToClusters = (goals: Record<TreeItem["id"], TreeItem>, treeData: TreeNode[]): Cluster => {

    const convertTreeItemToGoal = (item: TreeNode): ClusterGoal => {
        const goal = goals[item.goalId];
        return {
            GoalID: item.goalId,
            instanceId: item.instanceId,
            GoalType: typeMapping[goal.type],
            GoalContent: goal.content,
            GoalNote: "", // Assuming GoalNote is not present in TreeItem and set as empty
            SubGoals: (item.children) ? item.children.map(convertTreeItemToGoal) : [],
            GoalColor: item.color,
        };
    };

    return {
        ClusterGoals: treeData.map(convertTreeItemToGoal),
    };
};

const FileProvider: React.FC<PropsWithChildren> = ({children}) => {
    // const treeDataSlice = createTreeDataSlice();
    // XXX note: we should pass in initialTabs and tree if they exist in localStorage

    const [treeData, setTreeData] = useLocalStorage<TreeItem[]>(
        LocalStorageType.TREE,
        []
    );
    const [tabData, setTabData] = useLocalStorage<typeof initialTabs>(
        LocalStorageType.TAB,
        initialTabs
    );

    const initialState = createInitialState(tabData, treeData);
    console.log("transformation from localstorage to data: ", treeData)
    const [state, dispatch] = useReducer(treeDataSlice.reducer, initialState);
    const [jsonFileHandle, setJsonFileHandle] = useState<FileSystemFileHandle | null>(null);

    useEffect(() => {
        console.log("FileProvider state updated:", state);
    }, [state]);

    // // Listen to changes in redux state and write back to localStorage
    useEffect(() => {
        // Convert TreeNode[] to TreeItem[] for storage
        // Here we map TreeNode.goalId to TreeItem from state.goals
        const treeItems = createTreeDataFromTreeNode(state.goals, state.tree)

        setTreeData(treeItems);

        // Convert Map<Label, TabContent> to InitialTab[] for storage
        const tabsArray: typeof initialTabs = Array.from(state.tabs.entries()).map(([label, tabContent]) => ({
            label,
            icon: tabContent.icon,
            rows: tabContent.goalIds.map(goalId => state.goals[goalId]).filter(Boolean),
        }));

        setTabData(tabsArray);
    }, [state.tree, state.tabs, state.goals, setTreeData, setTabData]);



    const [xmlData, setXmlData] = useState("");

    // Debug: Log computed values
    const computedTreeData = createTreeDataFromTreeNode(state.goals, state.tree);
    const computedTabData = createTabDataFromTabs(state.goals, state.tabs);

    useEffect(() => {
        console.log("Computed treeData:", computedTreeData);
        console.log("Computed tabData:", computedTabData);
    }, [computedTreeData, computedTabData]);

    return (
        <FileContext.Provider value={{
            ...state,
            dispatch,
            treeData: computedTreeData,
            tabData: computedTabData,
            cluster: convertTreeDataToClusters(state.goals, state.tree),
            xmlData,
            // setTabData,
            // setTreeData,
            setXmlData,
            jsonFileHandle,
            setJsonFileHandle,
            // resetData,
        }}>
            {children}
        </FileContext.Provider>
    );
};

export default FileProvider;
