import { Canvg } from 'canvg';
import * as d3 from 'd3';
import { useState } from "react";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import ErrorModal, { ErrorModalProps } from "../ErrorModal";
import { useFileContext } from "../context/FileProvider";
import { useGraph } from "../context/GraphContext";

// Add showGraphSection prop to control Export button enablement
// This ensures Export is only available when user is in "Render Model" interface
const ExportFileButton = ({ showGraphSection }: { showGraphSection: boolean }) => {
	const { graph } = useGraph(); // Use the context to get the graph instance
	const {cluster } = useFileContext(); // Get goals and cluster from file context
	const [errorModal, setErrorModal] = useState<ErrorModalProps>({
		show: false,
		title: "",
		message: "",
		onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
	});

	// Simplified logic: Export is only available when showGraphSection is true
	// This means user must be in "Render Model" interface (after clicking "Arrange Hierarchy / Render Model")
	const isModelReadyForExport = (): boolean => {
		// Only enable export when user is in Render Model interface
		// AND there are functional goals in the cluster
		return showGraphSection && cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional");
	};

	// Function to get tooltip message based on current state
	const getTooltipMessage = (): string => {
		if (!showGraphSection) {
			return "Please click 'Arrange Hierarchy / Render Model' to enable export.";
		}
		if (cluster.ClusterGoals.length === 0) {
			return "Please add goals to the hierarchy before exporting.";
		}
		if (!cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional")) {
			return "Please add at least one functional goal (Do type) to the hierarchy before exporting.";
		}
		return "Export is ready.";
	};

	// Function to show error message when no goals are present
	const showNoGoalsError = () => {
		setErrorModal({
			show: true,
			title: "Cannot Export Model",
			message: "No goals have been added. Please add at least one goal before exporting.",
			onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
		});
	};

	// Function to recentre the view
	const recentreView = () => {
		if (graph) {
			graph.fit();
			graph.center();
		}
	};

	// Function to export graph as an image
	const exportGraphAsSVG = async () => {
		// Check if the model is ready before proceeding
		if (!isModelReadyForExport()) {
			setErrorModal({
				show: true,
				title: "Cannot Export Model",
				message: getTooltipMessage(),
				onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
			});
			return;
		}

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
			console.error('Failed to save file: ', error);
		}

		// Return focus to graph container to enable keyboard shortcuts
		setTimeout(() => {
			const graphContainer = document.getElementById('graphContainer');
			if (graphContainer) {
				graphContainer.focus();
			}
		}, 100);
	};

	// Function to export graph as PNG
	const exportGraphAsPNG = async () => {
		// Check if the model is ready before proceeding
		if (!isModelReadyForExport()) {
			setErrorModal({
				show: true,
				title: "Cannot Export Model",
				message: getTooltipMessage(),
				onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
			});
			return;
		}

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

		// Return focus to graph container to enable keyboard shortcuts
		setTimeout(() => {
			const graphContainer = document.getElementById('graphContainer');
			if (graphContainer) {
				graphContainer.focus();
			}
		}, 100);
	};

	// Check if the model is ready for export
	const isReady = isModelReadyForExport();
	const tooltipMessage = getTooltipMessage();

	// Create tooltip overlay for disabled state
	const tooltip = (
		<Tooltip id="export-tooltip">
			{tooltipMessage}
		</Tooltip>
	);

	return (
		<>
			<OverlayTrigger
				placement="bottom"
				overlay={tooltip}
				trigger={!isReady ? ['hover', 'focus'] : []}
			>
				<span className="d-inline-block">
					<Dropdown>
						<Dropdown.Toggle
							variant="outline-primary"
							id="export-dropdown"
							className="rounded-end-0"
							disabled={!isReady}
						>
							Export
						</Dropdown.Toggle>
						<Dropdown.Menu>
							<Dropdown.Item 
								onClick={exportGraphAsPNG}
								disabled={!isReady}
							>
								Export as PNG
							</Dropdown.Item>
							<Dropdown.Item 
								onClick={exportGraphAsSVG}
								disabled={!isReady}
							>
								Export as SVG
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</span>
			</OverlayTrigger>
			<ErrorModal {...errorModal} />
		</>
	);
};

export default ExportFileButton;
