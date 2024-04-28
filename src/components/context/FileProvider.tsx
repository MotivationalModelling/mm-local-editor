import React, { useState, createContext, useContext } from "react";
import { Label } from "../SectionPanel";

export type TreeItem = {
	id: number;
	content: string;
	type: Label;
	children?: TreeItem[];
};

type FileContextProps = {
	jsonFileHandle: FileSystemFileHandle | null;
	setJsonFileHandle: (jsonFile: FileSystemFileHandle | null) => void;
	treeData: TreeItem[];
	xmlData: string;
	setTreeData: (jsonData: TreeItem[]) => void;
	setXmlData: (xmlData: string) => void;
};

// Dummy data
const items: TreeItem[] = [
	{
		id: 0,
		content: "Do 1",
		type: "Do",
		children: [
			{ id: 1, content: "Be 1", type: "Be" },
			{ id: 2, content: "Role 2", type: "Who" },
			{
				id: 3,
				content: "Do 7",
				type: "Do",
				children: [{ id: 4, content: "Be 1", type: "Be" }],
			},
		],
	},
	{
		id: 5,
		content: "Do 3",
		type: "Do",
		children: [
			{ id: 6, content: "Role 5", type: "Who" },
			{ id: 7, content: "Be 3", type: "Be" },
			{ id: 8, content: "Feel 1", type: "Feel" },
		],
	},
];

const FileContext = createContext<FileContextProps>({
	jsonFileHandle: null,
	setJsonFileHandle: () => {},
	treeData: items,
	xmlData: "",
	setTreeData: () => {},
	setXmlData: () => {},
});

export const useFileContext = () => useContext(FileContext);

type FileProviderProps = { children: React.ReactNode };

const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
	const [jsonFileHandle, setJsonFileHandle] =
		useState<FileSystemFileHandle | null>(null);

	const [treeData, setTreeData] = useState<TreeItem[]>(items);
	const [xmlData, setXmlData] = useState("");

	return (
		<FileContext.Provider
			value={{
				treeData,
				xmlData,
				setTreeData,
				setXmlData,
				jsonFileHandle,
				setJsonFileHandle,
			}}
		>
			{children}
		</FileContext.Provider>
	);
};

export default FileProvider;
