import React, {
    createContext,
    PropsWithChildren,
    useContext,
    useReducer,
    useState
} from "react";
import {createInitialState, treeDataSlice} from "./treeDataSlice.ts";
import {initialTabs} from "../../data/initialTabs.ts";

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

export interface TreeNode {
    goalId: TreeItem["id"]
    children?: TreeNode[]
}

// require id and type fields, others optional.
export const newTreeItem = (initFields: Pick<TreeItem, "type"> & Partial<TreeItem>): TreeItem => ({
    content: "",
    id: initFields.id ?? Date.now(),
    ...initFields
});

// Type of the json data
export type JSONData = {
    tabData: TabContent[];
    treeData: TreeItem[];
};

// Type of the tree item content
export type TreeItem = {
    id: number;
    content: string;
    type: Label;
    children?: TreeItem[];
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

export type Label =  "Do" | "Be" | "Feel" | "Concern" | "Who";

export const DataType = { JSON: "AMMBER_JSON" };

export const LocalStorageType = {
    TREE: "ammber/treeData",
    TAB: "ammber/tabData",
};

// XXX this should be a Set
export const createTreeIdsFromTreeData = (treeData: TreeItem[]): TreeItem["id"][] => {
    const treeIds = treeData.map((td) => [
            td.id,
            ...createTreeIdsFromTreeData(td.children ?? [])
        ]
    ).flat();
    return treeIds;
};

// XXX move to treeDataSlice
export const createTreeDataFromTreeNode = (goals: Record<TreeItem["id"], TreeItem>, treeNode: TreeNode[]): TreeItem[] => {
    return treeNode.map((tn) => goals[tn.goalId]);
};

export const createTabDataFromTabs = (goals: Record<TreeItem["id"], TreeItem>, tabs: Map<Label, TabContent>): TabContent[] => {
    [...tabs.keys()]
    return [...tabs.values()];
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
    jsonFileHandle: FileSystemFileHandle | null;
    setJsonFileHandle: (jsonHandle: FileSystemFileHandle | null) => void;
    tabData: TabContent[];
    treeData: TreeItem[];
    xmlData: string
    dispatch: React.Dispatch<DispatchActions>
    // setTabData: (tabData: TabContent[]) => void;
    // setTreeData: (jsonData: TreeItem[]) => void;
    setXmlData: (xmlData: string) => void
    // resetData: () => void;
    tree: TreeNode[]
    tabs: Map<Label, TabContent>
    goals: Record<TreeItem["id"], TreeItem>
    treeIds: TreeItem["id"][]
}

// Create context for data tansfer and file handle
const FileContext = createContext<FileContextProps>({
    jsonFileHandle: null,
    setJsonFileHandle: () => {},
    tabData: [],
    treeData: [],
    xmlData: "",
    dispatch: null,
    // setTabData: () => {},
    // setTreeData: () => {},
    setXmlData: () => {},
    // resetData: () => {},
});

const FileProvider: React.FC<PropsWithChildren> = ({ children }) => {
    // const treeDataSlice = createTreeDataSlice();
    // XXX note: we should pass in initialTabs and tree if they exist in localStorage
    const initialState = createInitialState(initialTabs, []);
    const [state, dispatch] = useReducer(treeDataSlice.reducer, initialState);
    const [jsonFileHandle, setJsonFileHandle] = useState<FileSystemFileHandle | null>(null);
  // const [treeData, setTreeData] = useLocalStorage<TreeItem[]>(
  //   LocalStorageType.TREE,
  //   []
  // );
  // const [tabData, setTabData] = useLocalStorage<TabContent[]>(
  //   LocalStorageType.TAB,
  //   initialTabs
  // );

  const [xmlData, setXmlData] = useState("");

  // const resetData = () => {
  //   setJsonFileHandle(null);
  //   del(DataType.JSON);
  //   setTreeData([]);
  //   setTabData(initialTabs);
  //   localStorage.removeItem(LocalStorageType.TREE);
  //   localStorage.removeItem(LocalStorageType.TAB);
  // };

  return (
      <FileContext.Provider value={{
          ...state,
          dispatch,
          treeData: createTreeDataFromTreeNode(state.goals, state.tree),
          tabData: createTabDataFromTabs(state.goals, state.tabs),
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
