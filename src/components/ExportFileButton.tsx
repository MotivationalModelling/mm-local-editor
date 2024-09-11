import { useRef } from "react";
import { Button } from "react-bootstrap";
import { useGraph } from "./context/GraphContext";

const ExportFileButton = () => {
	const { graph } = useGraph(); // Use the context to get the graph instance
	const downloadRef = useRef<HTMLAnchorElement>(null);

	// Function to export graph as an image
	const exportGraph = async () => {
		if (!graph) {
			return;
		}
	
		// Get the container holding the SVG
		const svgElement = graph.getContainer().querySelector('svg');
	
		if (!svgElement) {
			console.error('Failed to find SVG element in the graph container.');
			return;
		}
	
		// Serialize the SVG element to a string
		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svgElement);
		try {
			// If chromium browser
			if ('showSaveFilePicker' in self) {
				const options = {
					id: 'exportImage',
					suggestedName: 'Graph.svg',
					startIn: 'downloads',
					types: [{
						description: 'SVG Image',
						accept: { 'image/svg+xml': ['.svg']}
					}]
				};
				const handle = await self.showSaveFilePicker(options);
				const writable = await handle.createWritable();
				await writable.write(new Blob([svgString], {type: 'image/svg+xml;charset=utf-8' }));
				await writable.close();
	
			}
			// Fallback for non chromium browsers
			else {
				// Create a Blob and trigger download
				const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
				const url = URL.createObjectURL(blob);
			
				const link = document.createElement('a');
				link.href = url;
				link.download = 'graph.svg';
				link.click();
			
				// Clean up
				URL.revokeObjectURL(url);
			}
		}

		catch (error) {
			console.error('Failed to sive file: ', error);
		}
	};

	const handleBtnClick = () => {
		exportGraph();
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
