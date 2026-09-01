import React, {createContext, PropsWithChildren, useContext, useEffect, useReducer, useState} from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import {createInitialState, treeDataSlice} from "./treeDataSlice.ts";
import {initialTabs} from "../../data/initialTabs.ts";
import {Cluster, ClusterGoal, GoalType, InstanceId, Label, TabContent, TreeGoal} from "../types.ts";
import {useLocalStorage} from "usehooks-ts";

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
    showLineBetweenNonFunctionalGoals: boolean
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
    showLineBetweenNonFunctionalGoals: true,
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

// The two persisted keys are kept as raw JSON strings (see rawStringStorage)
// so an unparseable value is neither silently discarded nor overwritten on
// load: the provider can surface it and leave it intact for inspection.
const rawStringStorage = {
    deserializer: (raw: string) => raw,
    serializer: (value: string) => value,
};

const normalizeIconPath = (icon: string): string => {
    const filename = icon.split("/").filter(Boolean).pop();
    if (!filename || !filename.toLowerCase().endsWith(".png")) return icon;

    const baseUrl = import.meta.env.BASE_URL;
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return `${normalizedBaseUrl}img/${filename}`;
};

// createInitialState throws when the stored JSON cannot be parsed or is
// inconsistent, e.g. the tree referencing goals that are not in tabData, or a
// value that is not the expected shape. Return null so the provider can ask the
// user how to recover instead of crashing.
const tryCreateInitialState = (tabData: string, treeData: string) => {
    try {
        const parsedTabData: typeof initialTabs = JSON.parse(tabData);
        const normalizedTabData = parsedTabData.map((tab) => ({
            ...tab,
            icon: normalizeIconPath(tab.icon),
        }));

        return createInitialState(normalizedTabData, JSON.parse(treeData));
    } catch (error) {
        console.error("Saved data could not be loaded:", error);
        return null;
    }
};

const FileProvider: React.FC<PropsWithChildren> = ({children}) => {
    // Load from localStorage
    const [storedTreeData, setStoredTreeData] = useLocalStorage<string>(
        LocalStorageType.TREE,
        "[]",
        rawStringStorage
    );
    const [tabData, setTabData] = useLocalStorage<string>(
        LocalStorageType.TAB,
        JSON.stringify(initialTabs),
        rawStringStorage
    );

    const initialState = tryCreateInitialState(tabData, storedTreeData);
    const corrupted = initialState === null;
    const [abandoned, setAbandoned] = useState(false);
    const [state, dispatch] = useReducer(treeDataSlice.reducer, initialState ?? createInitialState());
    const [jsonFileHandle, setJsonFileHandle] = useState<FileSystemFileHandle | null>(null);

    useEffect(() => {
        console.log("FileProvider state updated:", state);
    }, [state]);

    // Listen to changes in state and write back to localStorage. While the
    // corruption modal is up, the stored data must stay untouched so the
    // user can still choose to inspect it.
    useEffect(() => {
        if (corrupted) return;

        setStoredTreeData(JSON.stringify(state.tree));

        // Convert Map<Label, TabContent> to InitialTab[] for storage
        const tabsArray: typeof initialTabs = Array.from(state.tabs.entries()).map(([label, tabContent]) => ({
            label,
            icon: normalizeIconPath(tabContent.icon),
            rows: tabContent.goalIds.map(goalId => state.goals[goalId]).filter(Boolean),
        }));

        setTabData(JSON.stringify(tabsArray));
    }, [corrupted, state.tree, state.tabs, state.goals, setStoredTreeData, setTabData]);

    const [xmlData, setXmlData] = useState("");

    const computedTabData = createTabDataFromTabs(state.goals, state.tabs);

    useEffect(() => {
        console.log("Tree data:", state.tree);
        console.log("Tab data:", computedTabData);
    }, [state.tree, computedTabData]);

    const revertToDefault = () => {
        setTabData(JSON.stringify(initialTabs));
        setStoredTreeData("[]");
    };

    if (corrupted) {
        return (abandoned) ? (
            <Alert variant="warning" className="m-5">
                Editing is paused and your saved data has been left unchanged. You can
                inspect or repair it in the browser developer tools, then reload the page.
            </Alert>
        ) : (
            <Modal show centered backdrop="static" keyboard={false}>
                <Modal.Header>
                    <Modal.Title>Saved data is corrupted</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Your saved model could not be loaded. You can abandon editing and
                    leave the saved data untouched for inspection, or revert to the
                    default state, replacing the saved data.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setAbandoned(true)}>
                        Abandon
                    </Button>
                    <Button variant="warning" onClick={revertToDefault} style={{backgroundColor: "red"}}>
                        Revert to default
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

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
