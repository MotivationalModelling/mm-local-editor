import { Button } from "react-bootstrap";
import React, { useState, useRef, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import FileDrop from "./FileDrop";
import FileUploadSection from "./FileUploadSection";
import ErrorModal, { ErrorModalProps } from "./ErrorModal";
import { useFileContext, JSONData, DataType } from "./context/FileProvider";
import { set } from "idb-keyval";
import { isChrome, isOpera, isEdge } from "react-device-detect";

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

	const { setJsonFileHandle, dispatch } = useFileContext();

	const handleJSONFileSetup = async (handle: FileSystemFileHandle) => {
		try {
			await handle.createWritable();
			const file = await handle.getFile();
			const fileContent = await file.text();
			if (fileContent) {
				const convertedJsonData: JSONData = JSON.parse(fileContent);
				dispatch({
					type: "treeData/loadFromFile",
					payload: convertedJsonData,
				});
			} else {
				console.log("File can't be read and parsed");
			}
			set(DataType.JSON, handle);
			setJsonFileHandle(handle);
		} catch (error) {
			if (error instanceof DOMException) {
				setJsonFile(null);
			}
			console.log(`Error setup JSON File: ${error}`);
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
		if (isChrome || isEdge || isOpera) {
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
		} else if (jsonFileRef && jsonFileRef.current) {
			jsonFileRef.current.click();
		}
	};

	const handleFileChange = async (evt: ChangeEvent<HTMLInputElement>) => {
		try {
			if (evt.target.files && evt.target.files.length > 0) {
				const file = evt.target.files[0];
				setJsonFile(file);

				const fileContent = await file.text();
				if (fileContent) {
					const convertedJsonData: JSONData = JSON.parse(fileContent);
					dispatch({
						type: "treeData/loadFromFile",
						payload: convertedJsonData,
					});
				} else {
					console.log("File can't be read and parsed");
				}
			}
		} catch (error) {
			console.error("Error handling upload JSON file in Safari:", error);
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

	return (
		<div className="d-flex justify-content-center mt-3">
			{/* Error Modal while user upload wrong types or invalid files */}
			<ErrorModal {...errorModal} />

			{/* File Input */}
			<input
				type="file"
				accept=".json"
				multiple
				onChange={handleFileChange}
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
						to="/projectEdit"
						className="me-5"
						style={{ height: "60px" }}
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
