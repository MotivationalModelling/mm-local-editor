import { Button } from "react-bootstrap";
import { useFileContext, JSONData, DataType } from "./context/FileProvider";
import { set, get } from "idb-keyval";

const SaveFileButton = () => {
	const { setJsonFileHandle, treeData, tabData } = useFileContext();

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

	return (
		<Button onClick={handleBtnClick} className="m-2">
			Save
		</Button>
	);
};

export default SaveFileButton;
