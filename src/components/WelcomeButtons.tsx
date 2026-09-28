import React, {ChangeEvent, useRef, useState} from "react";
import Button from "react-bootstrap/Button";
import {useNavigate} from "react-router-dom";
import {createDefaultTabData, defaultTreeData} from "../data/initialTabs";
import ErrorModal, {ErrorModalProps} from "./ErrorModal";
import FileDrop from "./FileDrop";
import FileUploadSection from "./FileUploadSection";
import {useFileContext} from "./context/FileProvider";
import {reset} from "./context/treeDataSlice.ts";
import {ModelJsonError, parseModelJson} from "./modelJson.ts";
import {extractJsonFromPng, extractJsonFromSvg} from "./utils/imageMetadata";
import {convertTabContentToInitialTab} from "./utils/modelImport";

const EMPTY_FILE_ALERT = "Please select a file";
const MODEL_FILE_ALERT = "Please select a JSON, PNG, or SVG file.";

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

const WelcomeButtons = ({isDragging, setIsDragging}: WelcomeButtonsProps) => {
	const [jsonFile, setJsonFile] = useState<File | null>(null);
	const [isJsonDragOver, setIsJsonDragOver] = useState(false);
	const [errorModal, setErrorModal] = useState<ErrorModalProps>(defaultModalState);

	const jsonFileRef = useRef<HTMLInputElement>(null);

	const navigate = useNavigate();

	const {dispatch} = useFileContext();

	const showFileError = (title: string, message: string) => {
		setJsonFile(null);
		setErrorModal({
			...defaultModalState,
			show: true,
			title,
			message,
			onHide: () => setErrorModal(defaultModalState),
		});
	};

	const importJSONFile = async (file: File) => {
		const name = file.name.toLowerCase();
		const isJson = file.type === "application/json" || name.endsWith(".json");
		const isPng = file.type === "image/png" || name.endsWith(".png");
		const isSvg = file.type === "image/svg+xml" || name.endsWith(".svg");
		if (!isJson && !isPng && !isSvg) {
			showFileError("Incorrect File Type", MODEL_FILE_ALERT);
			return;
		}

		try {
			const embeddedData = isPng
				? await extractJsonFromPng(file)
				: isSvg ? await extractJsonFromSvg(file) : null;
			if (!isJson && embeddedData === null) {
				showFileError("No Model Data Found", "This image does not contain an AMMBER model. Export it from this editor first, or select a JSON file.");
				return;
			}
			const convertedJsonData = parseModelJson(
				isJson ? await file.text() : JSON.stringify(embeddedData)
			);
			const initialTabs = convertTabContentToInitialTab(
				convertedJsonData.tabData,
				convertedJsonData.treeData
			);

			dispatch(reset({
				tabData: initialTabs,
				treeData: convertedJsonData.treeData,
			}));
			setJsonFile(file);
			setErrorModal(defaultModalState);
		} catch (error) {
			console.error("Error importing model:", error);
			showFileError(
				"Invalid Model File",
				error instanceof ModelJsonError
					? error.message
					: "The selected file could not be read. Please try again."
			);
		}
	};

	// Handle Create Model button click - load default data
	const handleCreateModel = () => {
		dispatch(reset({
			treeData: defaultTreeData,
			tabData: createDefaultTabData()
		}));
	};

	const handleJSONFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsJsonDragOver(false); // Reset drag state

		const item = event.dataTransfer.items[0];
		const itemFile = item?.kind === "file" ? item.getAsFile() : null;
		const file = itemFile ?? event.dataTransfer.files[0];
		if (file) {
			await importJSONFile(file);
		} else {
			showFileError("File Upload Failed", EMPTY_FILE_ALERT);
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
		// Simplified: always use file input for better compatibility
		if (jsonFileRef && jsonFileRef.current) {
			jsonFileRef.current.click();
		}
	};

	const handleFileChange = async (evt: ChangeEvent<HTMLInputElement>) => {
		const file = evt.target.files?.[0];
		if (file) await importJSONFile(file);

		// Allow the same file to be selected again after it has been corrected.
		evt.target.value = "";
	};

	const handleJSONFileRemove = () => {
		setJsonFile(null);
		setIsJsonDragOver(false);
	};

	return (
		<div className="d-flex justify-content-center mt-3">
			{/* Error Modal while user upload wrong types or invalid files */}
			<ErrorModal {...errorModal} />

			{/* File Input */}
			<input
				type="file"
				accept=".json,.png,.svg,application/json,image/png,image/svg+xml"
				multiple
				onChange={handleFileChange}
				style={{display: "none"}}
				ref={jsonFileRef}
			/>
			{/* Conditionally render create/open buttons or files section */}
			{(isDragging) ? (
				<>
					{!jsonFile ? (
						<FileDrop
							onClick={handleJSONUpload}
							onDrop={handleJSONFileDrop}
							onDragLeave={handleFileDragLeave}
							onDragOver={handleJSONFileDragOver}
							isDragOver={isJsonDragOver}
							fileType="JSON, PNG, or SVG"
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
						style={{bottom: "80px"}}
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
					<Button 
						variant="primary" 
						size="lg"
						className="me-5"
						onClick={() => {
							handleCreateModel();
							navigate("/projectEdit");
						}}
					>
						Create Model
					</Button>
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
