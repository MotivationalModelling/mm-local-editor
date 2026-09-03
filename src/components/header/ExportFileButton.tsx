import {useState} from "react";
import {Graph} from "@maxgraph/core";
import {Canvg} from 'canvg';
import Dropdown from "react-bootstrap/Dropdown";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import ErrorModal, {ErrorModalProps} from "../ErrorModal";
import {useFileContext} from "../context/FileProvider";
import {useGraph} from "../context/GraphContext";
import {returnFocusToGraph} from "../utils/GraphUtils";
import DropdownButton from "react-bootstrap/DropdownButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {prepareSvgForPng} from "./SvgExportUtils";

const PNG_EXPORT_SCALE = 3;

// Add showGraphSection prop to control Export button enablement
// This ensures Export is only available when user is in "Render Model" interface
const ExportFileButton = ({showGraphSection}: { showGraphSection: boolean }) => {
    const {graph} = useGraph(); // Use the context to get the graph instance
    const {cluster} = useFileContext(); // Get goals and cluster from file context
    const [errorModal, setErrorModal] = useState<ErrorModalProps>({
        show: false,
        title: "",
        message: "",
        onHide: () => setErrorModal(prev => ({...prev, show: false}))
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

    const recentreView = (graph: Graph) => {
        if (graph) {
            graph.fit();
            graph.center();
        }
    };

    const findSVGElementInGraph = (graph: Graph) => {
        // Check if the model is ready before proceeding
        if (!isModelReadyForExport()) {
            setErrorModal({
                show: true,
                title: "Cannot Export Model",
                message: getTooltipMessage(),
                onHide: () => setErrorModal(prev => ({...prev, show: false}))
            });
            return null;
        }

        if (!graph) {
            return null;
        }

        recentreView(graph);

        // Clear all selection for no green bounding box
        graph.clearSelection();
        // Get the html holding the SVG
        const svgElement = graph.getContainer().querySelector('svg');

        if (!svgElement) {
            console.error('Failed to find SVG element in the graph container.');
            return null;
        }
        return svgElement;
    };

    // Function to export graph as an image
    const exportGraphAsSVG = async (graph: Graph) => {
        const svgElement = (graph) && findSVGElementInGraph(graph);
        if (!svgElement) {
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
                await writable.write(new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'}));
                await writable.close();
            }
            // Fallback for non chromium browsers
            else {
                // Create a Blob and trigger download
                const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
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
        returnFocusToGraph();
    };

    // Function to export graph as PNG
    const exportGraphAsPNG = async (graph: Graph) => {
        const svgElement = (graph) && findSVGElementInGraph(graph);
        if (!svgElement) {
            return;
        }

        // Prepare a separate SVG so PNG-only changes never alter the live graph.
        const exportSvg = prepareSvgForPng(svgElement);

        // Serialize the SVG element to a string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(exportSvg);

        // Create a canvas element
        const canvas = document.createElement('canvas');
        // Render at a higher pixel density for a sharper PNG export
        canvas.width = Math.round(svgElement.clientWidth * PNG_EXPORT_SCALE);
        canvas.height = Math.round(svgElement.clientHeight * PNG_EXPORT_SCALE);

        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Failed to get canvas context.');
            return;
        }
        context.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);

        // Use Canvg to render SVG onto the canvas
        const v = Canvg.fromString(context, svgString, {
            ignoreDimensions: true
        });

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
        returnFocusToGraph();
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
            <OverlayTrigger placement="bottom"
                            overlay={tooltip}
                            trigger={(!isReady) ? ['hover', 'focus'] : []}>
                <DropdownButton as={ButtonGroup}
                                title="Export"
                                variant="outline-primary"
                                disabled={!isReady}>
                    <Dropdown.Item onClick={() => exportGraphAsPNG(graph!)}
                                   disabled={!graph}>
                        Export as PNG
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => exportGraphAsSVG(graph!)}
                                   disabled={!graph}>
                        Export as SVG
                    </Dropdown.Item>
                </DropdownButton>
            </OverlayTrigger>
            <ErrorModal {...errorModal} />
        </>
    );
};

export default ExportFileButton;
