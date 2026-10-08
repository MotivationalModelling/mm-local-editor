import {useState} from "react";
import {Graph} from "@maxgraph/core";
import {Canvg} from 'canvg';
import generateAvatar from "animal-avatar-generator";
import * as d3 from 'd3';
import Dropdown from "react-bootstrap/Dropdown";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import ErrorModal, {ErrorModalProps} from "../ErrorModal";
import {useFileContext} from "../context/FileProvider";
import {useGraph} from "../context/GraphContext";
import {returnFocusToGraph} from "../utils/GraphUtils";
import {buildExportableSVG} from "../utils/ExportGraph";
import DropdownButton from "react-bootstrap/DropdownButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {embedJsonInPng, embedJsonInSvg} from "../utils/imageMetadata";
import {useFeedbackContext} from "../context/FeedbackContext";
import {useProfileContext} from "../context/ProfileContext";
import {
    MAX_EXPORTED_GOAL_FEEDBACK, PNG_FEEDBACK_PANEL_GAP, calculateFeedbackPanelLayout, calculatePngExportDimensions,
    drawFeedbackNodeBadges, drawFeedbackPanel, getFeedbackNodeBadges, groupFeedbackByNode,
} from "../utils/pngFeedbackAnnotations";

const PNG_EXPORT_SCALE = 3;

const loadAvatarImage = async (seed: string): Promise<HTMLImageElement | null> => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateAvatar(seed.trim() || "?", {size: 72}))}`;
    try {
        await image.decode();
        return image;
    } catch {
        return null;
    }
};

// Add showGraphSection prop to control Export button enablement
// This ensures Export is only available when user is in "Render Model" interface
const ExportFileButton = ({showGraphSection, includeNodeFeedback}: { showGraphSection: boolean; includeNodeFeedback: boolean }) => {
    const {graph} = useGraph(); // Use the context to get the graph instance
    const {cluster, tabData, treeData} = useFileContext(); // Get goals and cluster from file context
    const {feedbacks, overallFeedback} = useFeedbackContext();
    const {authorName, avatarSeed} = useProfileContext();
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

        // Serialize a bounded copy so no node falls outside the exported area
        const {clone, x, y, width, height} = buildExportableSVG(graph, svgElement);
        const serializer = new XMLSerializer();
        const shownFeedbacks = includeNodeFeedback ? feedbacks.slice(0, MAX_EXPORTED_GOAL_FEEDBACK) : [];
        const groups = groupFeedbackByNode(shownFeedbacks, (nodeId) => {
            const cell = graph.getDataModel().getCell(nodeId);
            const value = cell?.getValue();
            return typeof value === "string" ? value : undefined;
        });
        const measureContext = document.createElement("canvas").getContext("2d");
        const panelLayout = measureContext && (overallFeedback?.content.trim() || groups.length > 0)
            ? calculateFeedbackPanelLayout(measureContext, groups, overallFeedback, includeNodeFeedback ? feedbacks.length : 0)
            : null;
        let exportSvg: SVGSVGElement = clone;
        if (panelLayout) {
            const dimensions = calculatePngExportDimensions(width, height, panelLayout);
            const scale = 2;
            const panelCanvas = document.createElement("canvas");
            panelCanvas.width = Math.ceil(panelLayout.width * scale);
            panelCanvas.height = Math.ceil(dimensions.height * scale);
            const panelContext = panelCanvas.getContext("2d");
            if (!panelContext) return;
            panelContext.scale(scale, scale);
            const authors = new Set([
                ...(panelLayout.overall ? [panelLayout.overall.feedback.author] : []),
                ...shownFeedbacks.map((feedback) => feedback.author),
            ]);
            const avatars = new Map<string, HTMLImageElement>();
            await Promise.all([...authors].map(async (author) => {
                const seed = author === authorName ? avatarSeed.trim() || author : author;
                const avatar = await loadAvatarImage(seed);
                if (avatar) avatars.set(author, avatar);
            }));
            drawFeedbackPanel(panelContext, panelLayout, 0, dimensions.height, avatars);

            const namespace = "http://www.w3.org/2000/svg";
            const make = (tag: string) => document.createElementNS(namespace, tag);
            const wrapper = make("svg") as SVGSVGElement;
            wrapper.setAttribute("width", String(dimensions.width));
            wrapper.setAttribute("height", String(dimensions.height));
            wrapper.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
            const background = make("rect");
            background.setAttribute("width", String(dimensions.width));
            background.setAttribute("height", String(dimensions.height));
            background.setAttribute("fill", "white");
            wrapper.append(background);
            clone.setAttribute("x", "0");
            clone.setAttribute("y", "0");
            wrapper.append(clone);
            const badges = getFeedbackNodeBadges(groups, (nodeId) => {
                const cell = graph.getDataModel().getCell(nodeId);
                const state = cell ? graph.getView().getState(cell) : null;
                return state ? {x: state.x, y: state.y, width: state.width, height: state.height} : undefined;
            }, (point) => ({x: point.x - x, y: point.y - y}));
            badges.forEach((badge) => {
                const circle = make("circle");
                circle.setAttribute("cx", String(badge.x));
                circle.setAttribute("cy", String(badge.y));
                circle.setAttribute("r", "11");
                circle.setAttribute("fill", "#6847c9");
                circle.setAttribute("stroke", "white");
                circle.setAttribute("stroke-width", "2.5");
                wrapper.append(circle);
                const number = make("text");
                number.setAttribute("x", String(badge.x));
                number.setAttribute("y", String(badge.y + 4));
                number.setAttribute("text-anchor", "middle");
                number.setAttribute("font-size", "11");
                number.setAttribute("font-weight", "700");
                number.setAttribute("fill", "white");
                number.textContent = String(badge.number);
                wrapper.append(number);
            });
            const panel = make("image");
            panel.setAttribute("x", String(width + PNG_FEEDBACK_PANEL_GAP));
            panel.setAttribute("y", "0");
            panel.setAttribute("width", String(panelLayout.width));
            panel.setAttribute("height", String(dimensions.height));
            panel.setAttribute("href", panelCanvas.toDataURL("image/png"));
            wrapper.append(panel);
            exportSvg = wrapper;
        }
        const svgString = embedJsonInSvg(serializer.serializeToString(exportSvg), {tabData, treeData, feedbacks, overallFeedback});
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

        // Rasterise a bounded copy so no node falls outside the exported area
        const {clone, x, y, width, height} = buildExportableSVG(graph, svgElement);

        // Give the copy (not the live canvas) an opaque background. The rect needs
        // explicit coordinates: percentages would resolve against the viewBox size
        // but still start at 0, missing anything at a negative coordinate.
        d3.select(clone)
            .insert("rect", ":first-child")
            .attr("x", x)
            .attr("y", y)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "white");

        // Serialize the SVG element to a string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);

        // Create a canvas element
        const canvas = document.createElement('canvas');
        // Size the canvas from the graph bounds rather than the on-screen element,
        // and render at a higher pixel density for a sharper PNG export
        canvas.width = Math.round(width * PNG_EXPORT_SCALE);
        canvas.height = Math.round(height * PNG_EXPORT_SCALE);

        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Failed to get canvas context.');
            return;
        }
        // Canvg is told to ignore the SVG's own dimensions, so it draws the viewBox
        // 1:1 - the context scale is what actually applies PNG_EXPORT_SCALE
        context.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);

        // Use Canvg to render SVG onto the canvas
        const v = Canvg.fromString(context, svgString, {
            ignoreDimensions: true
        });

        // Render SVG onto the canvas
        await v.render();

        const shownFeedbacks = includeNodeFeedback ? feedbacks.slice(0, MAX_EXPORTED_GOAL_FEEDBACK) : [];
        const groups = groupFeedbackByNode(shownFeedbacks, (nodeId) => {
            const cell = graph.getDataModel().getCell(nodeId);
            const value = cell?.getValue();
            return typeof value === "string" ? value : undefined;
        });
        const panelLayout = overallFeedback?.content.trim() || groups.length > 0
            ? calculateFeedbackPanelLayout(context, groups, overallFeedback, includeNodeFeedback ? feedbacks.length : 0)
            : null;
        const dimensions = calculatePngExportDimensions(width, height, panelLayout);
        let exportCanvas = canvas;

        if (panelLayout) {
            const authors = new Set([
                ...(panelLayout.overall ? [panelLayout.overall.feedback.author] : []),
                ...shownFeedbacks.map((feedback) => feedback.author),
            ]);
            const avatars = new Map<string, HTMLImageElement>();
            await Promise.all([...authors].map(async (author) => {
                const seed = author === authorName ? avatarSeed.trim() || author : author;
                const image = await loadAvatarImage(seed);
                if (image) avatars.set(author, image);
            }));

            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = Math.round(dimensions.width * PNG_EXPORT_SCALE);
            finalCanvas.height = Math.round(dimensions.height * PNG_EXPORT_SCALE);
            const finalContext = finalCanvas.getContext("2d");
            if (!finalContext) return;
            finalContext.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);
            finalContext.fillStyle = "white";
            finalContext.fillRect(0, 0, dimensions.width, dimensions.height);
            finalContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);

            const badges = getFeedbackNodeBadges(groups, (nodeId) => {
                const cell = graph.getDataModel().getCell(nodeId);
                const state = cell ? graph.getView().getState(cell) : null;
                return state ? {x: state.x, y: state.y, width: state.width, height: state.height} : undefined;
            }, (point) => ({x: point.x - x, y: point.y - y}));
            drawFeedbackNodeBadges(finalContext, badges, "white");
            drawFeedbackPanel(finalContext, panelLayout, width + PNG_FEEDBACK_PANEL_GAP, dimensions.height, avatars);
            exportCanvas = finalCanvas;
        }

        // Convert the canvas content to a Blob (PNG format)
        exportCanvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    const imageWithModel = await embedJsonInPng(blob, {tabData, treeData, feedbacks, overallFeedback});
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
                        await writable.write(imageWithModel);
                        await writable.close();
                    } else {
                        // Fallback for non-Chromium browsers
                        const url = URL.createObjectURL(imageWithModel);
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
