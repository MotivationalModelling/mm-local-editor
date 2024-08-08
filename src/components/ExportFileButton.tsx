import { useRef } from "react";
import { useFileContext, JSONData } from "./context/FileProvider";
import { Button } from "react-bootstrap";

const ExportFileButton = () => {
	const { treeData, tabData } = useFileContext();
	const downloadRef = useRef<HTMLAnchorElement>(null);

	const exportJson = () => {
		console.log("Export json data");
		const jsonData: JSONData = {
			tabData: tabData,
			treeData: treeData,
		};
		// Create download url and trigger the download
		const json = JSON.stringify(jsonData);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		if (downloadRef.current) {
			downloadRef.current.href = url;
			downloadRef.current.download = "jsonData.json";
			downloadRef.current.click();
		}
	};

	const handleBtnClick = () => {
		exportJson();
	};

	return (
		<>
			<Button className="me-3" onClick={handleBtnClick}>
				Export
			</Button>
			<a ref={downloadRef} style={{ display: "none" }}>
				Download
			</a>
		</>
	);
};

export default ExportFileButton;
