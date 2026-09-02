import React, {ChangeEvent, useRef, useState} from "react";
import Button from "react-bootstrap/Button";
import {useNavigate} from "react-router-dom";
import {InitialTab, createDefaultTabData, defaultTreeData} from "../data/initialTabs";
import ErrorModal, {ErrorModalProps} from "./ErrorModal";
import FileDrop from "./FileDrop";
import FileUploadSection from "./FileUploadSection";
import {useFileContext} from "./context/FileProvider";
import {reset} from "./context/treeDataSlice.ts";
import {TabContent, TreeGoal} from "./types.ts";
import {ModelJsonError, parseModelJson} from "./modelJson.ts";

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

// Helper to convert TabContent[] to InitialTab[] using all goals from treeData
function convertTabContentToInitialTab(tabData: TabContent[], treeData: TreeGoal[]): InitialTab[] {
	// Build a map of all goals by id
	const allGoals: Record<number, TreeGoal> = {};
	(treeData || []).forEach((goal: TreeGoal) => {
		allGoals[goal.id] = goal;
		const addChildren = (children: TreeGoal[]) => {
			(children || []).forEach((child: TreeGoal) => {
				allGoals[child.id] = child;
				addChildren(child.children || []);
			});
		};
		addChildren(goal.children || []);
	});
	return (tabData || []).map((tab: TabContent) => ({
		label: tab.label,
		icon: tab.icon,
		rows: (tab.goalIds || []).map((id: number) => allGoals[id]).filter(Boolean),
	}));
}

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
		if (file.type !== "application/json" && !file.name.toLowerCase().endsWith(".json")) {
			showFileError("Incorrect File Type", JSON_FILE_ALERT);
			return;
		}

		try {
			const convertedJsonData = parseModelJson(await file.text());
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
			console.error("Error importing JSON model:", error);
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
				accept=".json"
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
