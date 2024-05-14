import { Button } from "react-bootstrap";
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import FileDrop from "./FileDrop";
import FileUploadSection from "./FileUploadSection";
import ErrorModal, { ErrorModalProps } from "./ErrorModal";
import {
	useFileContext,
	JSONData,
	DataType,
	tabs,
} from "./context/FileProvider";
import { set } from "idb-keyval";

const EMPTY_FILE_ALERT = "Please select a file";
const JSON_FILE_ALERT = "Please select a JSON file.";

type WelcomeButtonsProps = {
	isDragging: boolean;
	setIsDragging: (isDragging: boolean) => void;
};

const defaultModalState: ErrorModalProps = {
	show: false,
	title: "",
	message: "",
	onHide: () => {},
};

// File handle preserve on page refresh
// https://stackoverflow.com/questions/65928613/file-system-access-api-is-it-possible-to-store-the-filehandle-of-a-saved-or-loa

const WelcomeButtons = ({ isDragging, setIsDragging }: WelcomeButtonsProps) => {
	const [jsonFile, setJsonFile] = useState<File | null>(null);
	const [isJsonDragOver, setIsJsonDragOver] = useState(false);
	const [errorModal, setErrorModal] =
		useState<ErrorModalProps>(defaultModalState);

	const jsonFileRef = useRef<HTMLInputElement>(null);

	const navigate = useNavigate();

	const { setJsonFileHandle, setTabData, setTreeData } = useFileContext();

	// Handle after select JSON file
	const handleJSONFileSetup = async (handle: FileSystemFileHandle) => {
		try {
			const file = await handle.getFile();
			const fileContent = await file.text();
			if (fileContent) {
				const convertedJsonData: JSONData = JSON.parse(fileContent);
				setTabData(convertedJsonData.tabData);
				setTreeData(convertedJsonData.treeData);
			} else {
				setTabData([]);
				setTreeData([]);
			}
			// Save JSON file handle to IndexedDB
			set(DataType.JSON, handle);
			setJsonFileHandle(handle);
		} catch (error) {
			console.log(`Error setup JSON File: ${error}`);
		}
	};

	// Handle after create JSON file
	const handleJSONFileInit = async (
		handle: FileSystemFileHandle,
		writable: FileSystemWritableFileStream
	) => {
		try {
			console.log(handle);
			const initialTabs = tabs.map((tab, index) => ({
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
			setTabData(initialTabs);
			setTreeData([]);
			const jsonData: JSONData = {
				tabData: initialTabs,
				treeData: [],
			};
			const json = JSON.stringify(jsonData);
			await writable.write(json);
			await writable.close();
			// Save JSON file handle to IndexedDB
			set(DataType.JSON, handle);
			setJsonFileHandle(handle);
		} catch (error) {
			console.log(`Error initialize JSON File: ${error}`);
		}
	};

	// Handle JSON file drop
	const handleJSONFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		try {
			const items = event.dataTransfer.items;
			if (items.length > 0) {
				const item = items[0];
				if (item.kind === "file") {
					const fileHandle =
						(await item.getAsFileSystemHandle()) as FileSystemFileHandle;
					if (fileHandle) {
						await handleJSONFileInputChange(fileHandle);
					}
				}
			}
		} catch (error) {
			console.error("Error handling dropped JSON file:", error);
		}
	};

	const handleJSONFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsJsonDragOver(true);
	};

	const handleFileDragLeave = () => {
		setIsJsonDragOver(false);
	};

	const handleJSONUpload = async () => {
		try {
			const [handle] = await window.showOpenFilePicker({
				types: [
					{
						description: "JSON file",
						accept: { "application/json": [".json"] },
					},
				],
				multiple: false,
			});
			const file = await handle.getFile();
			setJsonFile(file);

			await handleJSONFileSetup(handle);
		} catch (error) {
			console.error(`Error selecting JSON file: ${error}`);
		}
	};

	/* --------------------------------------------------------------------------------------------------------*/

	const handleJSONFileInputChange = async (
		fileHandle: FileSystemFileHandle
	) => {
		const file = await fileHandle.getFile();
		if (!file) {
			setIsJsonDragOver(false);
			setErrorModal({
				...defaultModalState,
				show: true,
				title: "File Upload Failed",
				message: EMPTY_FILE_ALERT,
				onHide: () => setErrorModal(defaultModalState),
			});
			return;
		}

		if (file.type !== "application/json") {
			setIsJsonDragOver(false);
			setErrorModal({
				...defaultModalState,
				show: true,
				title: "Incorrect File Type",
				message: JSON_FILE_ALERT,
				onHide: () => setErrorModal(defaultModalState),
			});
			return;
		}
		await handleJSONFileSetup(fileHandle);
	};

	const handleJSONFileRemove = () => {
		setJsonFile(null);
		setIsJsonDragOver(false);
	};

	/* --------------------------------------------------------------------------------------------------------*/

	// Create json file after use input the name
	const handleCreateBtnClick = async () => {
		try {
			// Pop-up for user to input file name
			const fileName = prompt("Enter file name:");
			if (!fileName) return;

			// Create JSON file handle
			await triggerFileSave(fileName, "json");
			// setJsonFileHandle(jsonHandle);
			navigate("/projectEdit");
		} catch (error) {
			console.error(`Error creating files: ${error}`);
		}
	};

	async function triggerFileSave(
		fileName: string,
		fileType: "json"
	): Promise<void> {
		try {
			const handle = await window.showSaveFilePicker({
				types: [
					{
						description: "JSON Files",
						accept: {
							"application/json": [".json"],
						},
					},
				],
				suggestedName: `${fileName}.json`,
			});
			const writable = await handle.createWritable();
			await handleJSONFileInit(handle, writable);
		} catch (error) {
			console.error(`Error creating ${fileType} file: ${error}`);
		}
	}

	/* --------------------------------------------------------------------------------------------------------*/

	return (
		<div className="d-flex justify-content-center mt-3">
			{/* Error Modal while user upload wrong types or invalid files */}
			<ErrorModal {...errorModal} />

			{/* File Input */}
			<input
				type="file"
				accept=".json"
				multiple
				style={{ display: "none" }}
				ref={jsonFileRef}
			/>
			{/* Conditionally render create/open buttons or files section */}
			{isDragging ? (
				<>
					{!jsonFile ? (
						<FileDrop
							onClick={handleJSONUpload}
							onDrop={handleJSONFileDrop}
							onDragLeave={handleFileDragLeave}
							onDragOver={handleJSONFileDragOver}
							isDragOver={isJsonDragOver}
							fileType="JSON"
						/>
					) : (
						<FileUploadSection
							file={jsonFile}
							onRemove={handleJSONFileRemove}
							onUpload={handleJSONUpload}
						/>
					)}
					<div
						className="position-absolute d-flex flex-row gap-5"
						style={{ bottom: "160px" }}
					>
						<Button
							variant="primary"
							size="lg"
							onClick={() => setIsDragging(false)}
							className="align-self-center"
						>
							Back
						</Button>
						<Button
							variant="primary"
							size="lg"
							disabled={!jsonFile ? true : false}
							onClick={() => navigate("/projectEdit")}
						>
							Upload
						</Button>
					</div>
				</>
			) : (
				<>
					{/* Link section is bigger than Button section, click outside Button could trigger navigation,
             hard code a static height for temporary, need a better solution
          */}
					<Link
						to="#"
						className="me-5"
						style={{ height: "60px" }}
						onClick={handleCreateBtnClick}
						draggable={false}
					>
						<Button variant="primary" size="lg">
							Create Model
						</Button>
					</Link>
					<Button
						variant="primary"
						size="lg"
						onClick={() => setIsDragging(true)}
						className="align-self-start ms-5"
					>
						Open Model
					</Button>
				</>
			)}
		</div>
	);
};

export default WelcomeButtons;
