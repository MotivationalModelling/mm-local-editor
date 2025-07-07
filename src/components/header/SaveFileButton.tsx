import { get, set } from "idb-keyval";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { DataType, JSONData, useFileContext } from "../context/FileProvider";
import ErrorModal, { ErrorModalProps } from "../ErrorModal";

const SaveFileButton = () => {
	const { setJsonFileHandle, treeData, tabData, goals } = useFileContext();
	const [errorModal, setErrorModal] = useState<ErrorModalProps>({
		show: false,
		title: "",
		message: "",
		onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
	});

	// Function to check if there are any goals with content
	const hasGoalsWithContent = (): boolean => {
		// Check if any goal in the goals object has non-empty content
		return Object.values(goals).some(goal => goal.content.trim() !== "");
	};

	// Function to show error message when no goals are present
	const showNoGoalsError = () => {
		setErrorModal({
			show: true,
			title: "Cannot Save Model",
			message: "No goals have been added. Please add at least one goal before saving.",
			onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
		});
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

	// Handle after create JSON file
	const handleJSONFileInit = async (
		handle: FileSystemFileHandle,
		writable: FileSystemWritableFileStream
	) => {
		try {
			console.log(handle);
			const jsonData: JSONData = {
				tabData: tabData,
				treeData: treeData || [],
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

	const saveJson = async (handle: FileSystemFileHandle) => {
		// Use the created/selected file handle to have write access to the local file
		try {
			const writable = await handle.createWritable();
			const jsonData: JSONData = {
				tabData: tabData,
				treeData: treeData,
			};
			const json = JSON.stringify(jsonData);
			await writable.write(json);
			await writable.close();
		} catch (error) {
			console.error("Error saving content to file:", error);
		}
	};
	const handleBtnClick = async () => {
		// Check if there are any goals with content before proceeding
		if (!hasGoalsWithContent()) {
			showNoGoalsError();
			return;
		}

		const jsonHandle = await get(DataType.JSON);
		console.log(jsonHandle);
		if (!jsonHandle) {
			try {
				// Pop-up for user to input file name
				const fileName = prompt("Enter file name:");
				if (!fileName) return;

				// Create JSON file handle
				await triggerFileSave(fileName, "json");
			} catch (error) {
				console.error(`Error creating files: ${error}`);
			}
		} else {
			await saveJson(jsonHandle);
		}
	};
	// className="m-2"

	return (
		<>
			<Button variant="outline-primary" onClick={handleBtnClick}>
				Save
			</Button>
			<ErrorModal {...errorModal} />
		</>
	);
};

export default SaveFileButton;
