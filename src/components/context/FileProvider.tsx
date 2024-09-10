import React, { useState, createContext, useContext } from "react";
import WhoIcon from "/img/Stakeholder.png";
import DoIcon from "/img/Function.png";
import BeIcon from "/img/Cloud.png";
import FeelIcon from "/img/Heart.png";
import ConcernIcon from "/img/Risk.png";
import useLocalStorage from "../utils/useLocalStorage";
import { del } from "idb-keyval";

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
  label: Label;
  icon: string;
  rows: TreeItem[];
};

// Define the initial tabs with labels and corresponding icons
export const tabs: TabContent[] = [
  { label: "Do", icon: DoIcon, rows: [] },
  { label: "Be", icon: BeIcon, rows: [] },
  { label: "Feel", icon: FeelIcon, rows: [] },
  { label: "Concern", icon: ConcernIcon, rows: [] },
  { label: "Who", icon: WhoIcon, rows: [] },
];

export const initialTabs = tabs.map((tab, index) => ({
  ...tab,
  rows: [
    ...tab.rows,
    {
      id: Date.now() + index,
      type: tab.label,
      content: "",
    },
  ],
}));

export type Label =  "Do" | "Be" | "Feel" | "Concern" | "Who";

export const DataType = { JSON: "AMMBER_JSON" };

export const LocalStorageType = {
  TREE: "ammber/treeData",
  TAB: "ammber/tabData",
};

type FileContextProps = {
  jsonFileHandle: FileSystemFileHandle | null;
  setJsonFileHandle: (jsonHandle: FileSystemFileHandle | null) => void;
  tabData: TabContent[];
  treeData: TreeItem[];
  xmlData: string;
  setTabData: (tabData: TabContent[]) => void;
  setTreeData: (jsonData: TreeItem[]) => void;
  setXmlData: (xmlData: string) => void;
  resetData: () => void;
};

// Create context for data tansfer and file handle
const FileContext = createContext<FileContextProps>({
  jsonFileHandle: null,
  setJsonFileHandle: () => {},
  tabData: [],
  treeData: [],
  xmlData: "",
  setTabData: () => {},
  setTreeData: () => {},
  setXmlData: () => {},
  resetData: () => {},
});

export const useFileContext = () => useContext(FileContext);

type FileProviderProps = { children: React.ReactNode };

const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [jsonFileHandle, setJsonFileHandle] =
    useState<FileSystemFileHandle | null>(null);

  const [treeData, setTreeData] = useLocalStorage<TreeItem[]>(
    LocalStorageType.TREE,
    []
  );
  const [tabData, setTabData] = useLocalStorage<TabContent[]>(
    LocalStorageType.TAB,
    initialTabs
  );

  const [xmlData, setXmlData] = useState("");

  const resetData = () => {
    setJsonFileHandle(null);
    del(DataType.JSON);
    setTreeData([]);
    setTabData(initialTabs);
    localStorage.removeItem(LocalStorageType.TREE);
    localStorage.removeItem(LocalStorageType.TAB);
  };

  return (
    <FileContext.Provider
      value={{
        tabData,
        treeData,
        xmlData,
        setTabData,
        setTreeData,
        setXmlData,
        jsonFileHandle,
        setJsonFileHandle,
        resetData,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export default FileProvider;
