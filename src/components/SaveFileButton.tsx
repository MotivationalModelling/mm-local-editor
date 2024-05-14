import { Button } from "react-bootstrap";
import { useFileContext, JSONData } from "./context/FileProvider";

const SaveFileButton = () => {
	const { jsonFileHandle, treeData, tabData } = useFileContext();

	const saveJson = async () => {
		// Use the created/selected file handle to have write access to the local file
		if (jsonFileHandle) {
			try {
				const writable = await jsonFileHandle.createWritable();
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
		} else {
			console.error("No file handle available to save content");
		}
	};
	const handleBtnClick = async () => {
		await saveJson();
	};

	return (
		<Button onClick={handleBtnClick} className="m-2">
			Save
		</Button>
	);
};

export default SaveFileButton;
