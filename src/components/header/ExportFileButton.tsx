import { Dropdown, DropdownButton } from "react-bootstrap";
import { useGraph } from "../context/GraphContext";
import { Canvg } from 'canvg';
import * as d3 from 'd3';

const ExportFileButton = () => {
	const { graph } = useGraph(); // Use the context to get the graph instance

	// Function to recentre the view
	const recentreView = () => {
		if (graph) {
			graph.fit();
			graph.center();
		}
	};

	// Function to export graph as an image
	const exportGraphAsSVG = async () => {
		if (!graph) {
			return;
		}

		recentreView();
	
		// Clear all selection for no green bounding box
		graph.clearSelection();
		// Get the html holding the SVG
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
				const options: SaveFilePickerOptions = {
					id: 'exportImage',
					suggestedName: 'Graph.svg',
					startIn: 'downloads',
					types: [{
						description: 'SVG Image',
						accept: {'image/svg+xml': ['.svg']}
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

	// Function to export graph as PNG
	const exportGraphAsPNG = async () => {
		if (!graph) {
			return;
		}
		
		recentreView();

		// Clear all selection for no green bounding box
		graph.clearSelection();

		// Get the container holding the SVG
		const svgElement = graph.getContainer().querySelector('svg');

		if (!svgElement) {
			console.error('Failed to find SVG element in the graph container.');
			return;
		}

		// Append a white background rect to the SVG
		// Use D3 to select the SVG and append a white background rect
		const svg = d3.select(svgElement);
		svg.insert("rect", ":first-child")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "white");

		// Serialize the SVG element to a string
		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svgElement);

		// Create a canvas element
		const canvas = document.createElement('canvas');
		// Set canvas dimensions to match the SVG size
		canvas.width = svgElement.clientWidth;
		canvas.height = svgElement.clientHeight;

		const context = canvas.getContext('2d');
		if (!context) {
			console.error('Failed to get canvas context.');
			return;
		}

		// Use Canvg to render SVG onto the canvas
		const v = Canvg.fromString(context, svgString);

		// Render SVG onto the canvas
		await v.render();

		// Convert the canvas content to a Blob (PNG format)
		canvas.toBlob(async (blob) => {
			if (blob) {
				try {
					if ('showSaveFilePicker' in self) {
						const options: SaveFilePickerOptions = {
							id: 'exportImage',
							suggestedName: 'Graph.png',
							startIn: 'downloads',
							types: [{
								description: 'PNG Image',
								accept: {'image/png': ['.png']}
							}]
						};
						const handle = await self.showSaveFilePicker(options);
						const writable = await handle.createWritable();
						await writable.write(blob);
						await writable.close();
					} else {
						// Fallback for non-Chromium browsers
						const url = URL.createObjectURL(blob);
						const link = document.createElement('a');
						link.href = url;
						link.download = 'graph.png';
						link.click();
						URL.revokeObjectURL(url);
					}
				} catch (error) {
					console.error('Failed to save file: ', error);
				}
			}
		}, 'image/png');
	};

	

	return (
		<DropdownButton variant="outline-primary" title="Export" drop="down">
			<Dropdown.Item onClick={exportGraphAsPNG}>Export as PNG</Dropdown.Item>
			<Dropdown.Item onClick={exportGraphAsSVG}>Export as SVG</Dropdown.Item>
		</DropdownButton>
	);
};

export default ExportFileButton;
