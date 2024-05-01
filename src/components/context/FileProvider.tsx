import React, { useState, createContext, useContext } from "react";
import WhoIcon from "../../assets/img/Stakeholder.png";
import DoIcon from "../../assets/img/Function.png";
import BeIcon from "../../assets/img/Cloud.png";
import FeelIcon from "../../assets/img/Heart.png";
import ConcernIcon from "../../assets/img/Risk.png";

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
	{ label: "Who", icon: WhoIcon, rows: [] },
	{ label: "Do", icon: DoIcon, rows: [] },
	{ label: "Be", icon: BeIcon, rows: [] },
	{ label: "Feel", icon: FeelIcon, rows: [] },
	{ label: "Concern", icon: ConcernIcon, rows: [] },
];

export type Label = "Who" | "Do" | "Be" | "Feel" | "Concern";

export const DataType = { JSON: "AMMBER_JSON", XML: "AMMBER_XML" };

type FileContextProps = {
	jsonFileHandle: FileSystemFileHandle | null;
	setJsonFileHandle: (jsonHandle: FileSystemFileHandle | null) => void;
	xmlFileHandle: FileSystemFileHandle | null;
	setXmlFileHandle: (xmlHandle: FileSystemFileHandle | null) => void;
	tabData: TabContent[];
	treeData: TreeItem[];
	xmlData: string;
	setTabData: (tabData: TabContent[]) => void;
	setTreeData: (jsonData: TreeItem[]) => void;
	setXmlData: (xmlData: string) => void;
};

// Create context for data tansfer and file handle
const FileContext = createContext<FileContextProps>({
	jsonFileHandle: null,
	setJsonFileHandle: () => {},
	xmlFileHandle: null,
	setXmlFileHandle: () => {},
	tabData: [],
	treeData: [],
	xmlData: "",
	setTabData: () => {},
	setTreeData: () => {},
	setXmlData: () => {},
});

export const useFileContext = () => useContext(FileContext);

type FileProviderProps = { children: React.ReactNode };

const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
	const [jsonFileHandle, setJsonFileHandle] =
		useState<FileSystemFileHandle | null>(null);
	const [xmlFileHandle, setXmlFileHandle] =
		useState<FileSystemFileHandle | null>(null);

	const [treeData, setTreeData] = useState<TreeItem[]>([]);
	const [tabData, setTabData] = useState<TabContent[]>([]);

	const [xmlData, setXmlData] = useState("");

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
				xmlFileHandle,
				setXmlFileHandle,
			}}
		>
			{children}
		</FileContext.Provider>
	);
};

export default FileProvider;
