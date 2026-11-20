import {
    Cell,
    CellEditorHandler,
    Client,
    DragSource,
    error,
    EventObject,
    GeometryChange,
    getDefaultPlugins,
    Graph,
    InternalEvent,
    KeyHandler,
    RubberBandHandler,
    UndoManager,
    UndoableEdit,
    ValueChange,
} from "@maxgraph/core";
import '@maxgraph/core/css/common.css';

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import ErrorModal, {ErrorModalProps} from "../ErrorModal.tsx";
import {isGoalNameEmpty} from "../utils/GoalUtils";
import {
    associateNonFunctions,
    getGoalLinkForCell,
    layoutFunctions,
    renderGoals,
    restoreSavedPositions,
    updateGoalColours
} from './GraphHelpers';
import {registerCustomShapes} from "./GraphShapes";
import "./GraphWorker.css";
import {useFileContext} from "../context/FileProvider.tsx";
import {useGraph} from "../context/GraphContext";
import {Cluster, GlobObject} from "../utils/types.ts";
import GraphSidebar from "./GraphSidebar";
import WarningMessage from "./WarningMessage";

import {VERTEX_FONT} from "../utils/GraphConstants.tsx"
import {getCellNumericIds, isGoalRefId} from "../utils/GraphUtils";
import {convertEditingValueToList, isDoCell} from "./GraphLabelUtils";
import {GoalGraph} from "./GoalGraph";
import {GoalCellEditorHandler} from "./GoalCellEditorHandler";
import {isNonFunctionCell} from "./GraphCellUtils";
import {removeGoalIdFromTree, updateTextForInstanceId, updatePositionForInstanceId} from "../context/treeDataSlice.ts";
import ConfirmModal from "../ConfirmModal.tsx";
import {parseGoalRefId} from "../utils/GraphUtils";
import {fixEditorPosition, returnFocusToGraph} from "../utils/GraphUtils.tsx";
import {applyGoalLayout, captureGoalGeometry, hasSameGoalHierarchy, restoreGoalGeometry} from "./GraphGeometryUtils";
import {getGeometryToFitLabel} from "./GraphFontFit";
import type {GoalLayout} from "../utils/modelJson";

//Graph id & Side bar id
const GRAPH_DIV_ID = "graphContainer";

// keybinding for the 'delete' key on MacOS; this is used in the implementation
//   of the delete function
const DELETE_KEYBINDING = 8;
const DELETE_KEYBINDING2 = 46;
const UNDO_KEYBINDING = 90;

class GoalKeyHandler extends KeyHandler {
    override isControlDown(event: KeyboardEvent): boolean {
        return Client.IS_MAC ? event.metaKey : super.isControlDown(event);
    }
}

// Extracted outside component - no useCallback needed, better for testing
const recentreView = (graphInstance: Graph) => {
    graphInstance.fit();
    graphInstance.center();
};
const GraphWorker: React.FC<{ showGraphSection?: boolean }> = ({showGraphSection = false}) => {
    const divGraph = useRef<HTMLDivElement>(null);
    const {cluster, dispatch, treeData, treeIds, showLineBetweenNonFunctionalGoals, nonFunctionalLayout, functionalLayout} = useFileContext();
    const appliedLayoutRef = useRef<{functional: GoalLayout; nonFunctional: GoalLayout} | null>(null);
    const renderedTreeRef = useRef(treeData);
    const {graph, setGraph} = useGraph();
    const treeIdsRef = useRef(treeIds);
    treeIdsRef.current = treeIds;
    // Guards against dispatching stale positions while renderGraph is rebuilding cells.
    const isRenderingRef = useRef(false);
    const editedCellIdsRef = useRef(new Set<string>());
    const previousRenderRef = useRef<{graph: Graph; cluster: Cluster; showLines: boolean} | null>(null);


    const hasFunctionalGoal = (cluster: Cluster) => (
        cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional")
    );
    const hasFunctionalGoalInCluster = useMemo<boolean>(() => hasFunctionalGoal(cluster), [cluster]);

    const [errorModal, setErrorModal] = useState<ErrorModalProps>({
        show: false,
        title: "",
        message: "",
        onHide: () => setErrorModal(prev => ({...prev, show: false})),
    });


    const [showDeleteWarning, setShowDeleteWarning] = useState(false);

    const [removeChildren, setRemoveChildren] = useState(false);
    const [deletingCells, setDeletingCells] = useState<Cell[] | null>(null);

    const childrenOfSelectedCell = (graph: Graph, selectedCell: Cell): Cell[] => {
        const outgoingEdges = graph.getOutgoingEdges(selectedCell, null);
        return outgoingEdges.filter((edge) => edge?.target !== selectedCell);
    };

    const deleteItemFromGraph = (graph: Graph, removeChildrenFlag: boolean, cells: Cell[]) => {

        if (!cells || !graph) return;

        // 1) Collect all cells that would be removed (including children)
        const toRemoveSet = new Set<Cell>();
        const collect = (cell: Cell) => {
            if (toRemoveSet.has(cell)) return;
            toRemoveSet.add(cell);
            const outgoing = graph.getOutgoingEdges(cell, null) || [];
            if (removeChildrenFlag && outgoing.length) {
                outgoing.forEach(edge => { if (edge.target) collect(edge.target); });
            }
        };
        cells.forEach(collect);
        const toRemove = Array.from(toRemoveSet);

        // 2) Validate all IDs up-front
        type InvalidInfo = { id: string | null, reason: string };
        const invalids: InvalidInfo[] = [];
        const parsedByCell = new Map<Cell, ReturnType<typeof parseGoalRefId>>();

        toRemove.forEach(cell => {
            const id = cell.getId();
            try {
                parsedByCell.set(cell, parseGoalRefId(id!));

            } catch (err) {
                invalids.push({
                    id: id ?? 'unknown',
                    reason: err instanceof Error ? err.message : 'Unknown parsing error',
                });
            }
        });

        // 3) If any invalid, show ONE modal and abort (do not touch the graph)
        if (invalids.length > 0) {
            const message = invalids
                .map(inv => inv.reason)
                .join('\n\n'); // keep \n, and render with pre-wrap (see Modal)
            setErrorModal({
                show: true,
                title: 'Invalid Cell IDs',
                message,
                onHide: () => setErrorModal(prev => ({...prev, show: false})),
            });
            return; // abort deletion
        }

        // 4) All valid → proceed to remove from graph (same recursive removal you used)
        const deletedCells: Cell[] = [];
        const removeCellRecursively = (cell: Cell) => {
            const outgoing = graph.getOutgoingEdges(cell, null) || [];
            if (removeChildrenFlag && outgoing.length) {
                outgoing.forEach(edge => { if (edge.target) removeCellRecursively(edge.target); });
            }
            const removed = graph.removeCells([cell], removeChildrenFlag) || [];
            deletedCells.push(...removed);
        };
        cells.forEach(cell => removeCellRecursively(cell));

        // 5) Dispatch Redux actions only for actually deleted cells,
        //    reuse the validated records for the same cell objects.
        deletedCells.forEach(cell => {
            const pairs = parsedByCell.get(cell);
            // removeCells also returns connected edges, which have no goal records.
            if (!pairs) return;
            pairs.forEach(({goalId, instanceId}) => {
                dispatch(removeGoalIdFromTree({
                    id: goalId,
                    instanceId,
                    removeChildren: removeChildrenFlag,
                }));
            });
        });
        setShowDeleteWarning(false);
    };


    // Function to reset the graph to empty
    //  const resetEmptyGraph = () => {
    //   if (graph) {
    //     onResetEmpty();
    //   }
    // };

    // Function to reset the graph to the default set of goals
    // const resetDefaultGraph = () => {
    //   if (graph) {
    //     onResetDefault();
    //   }
    // };

    // Using useRef instead of useState because this value is only used to detect
    // changes (comparing previous vs current count) and does not affect UI rendering.
    // Updating a ref doesn't trigger re-renders, which is more efficient for this use case.
    const prevClusterGoalsCountRef = useRef(cluster.ClusterGoals.length);
    const setGraphStyle = (graph: Graph) => {
        // config: permit vertices to be connected by edges
        //graph.setConnectable(true);
        graph.setCellsEditable(true);
        graph.setPanning(true);
        graph.autoExtend = false;
        graph.setCellsResizable(true);
        graph.setCellsMovable(true); // Allow cells to be moved
        graph.setCellsSelectable(true); // Allow cells to be selected


        // config: set default style for edges inserted into graph
        const edgeStyle = graph.getStylesheet().getDefaultEdgeStyle();
        edgeStyle.strokeColor = "black";
        edgeStyle.fontColor = "black";
        edgeStyle.endArrow = "none";
        edgeStyle.strokeWidth = 2;
        edgeStyle.editable = true;
        // edgeStyle['edgeStyle'] = "customMMEdgeStyle";
        graph.getStylesheet().putDefaultEdgeStyle(edgeStyle);

        // config: set default style for vertices inserted into graph
        const nodeStyle = graph.getStylesheet().getDefaultVertexStyle();
        nodeStyle.fillColor = "#ffffff";
        nodeStyle.strokeColor = "#000000";
        nodeStyle.strokeWidth = 2;
        nodeStyle.autoSize = false;
        nodeStyle.resizable = true;
        nodeStyle.fontSize = VERTEX_FONT.size;
        nodeStyle.fontColor = VERTEX_FONT.color;
        nodeStyle.editable = true;
        nodeStyle.shape = "image";
        nodeStyle.imageAspect = false;
        graph.getStylesheet().putDefaultVertexStyle(nodeStyle);
    };

    // Ensure mouse interactions restore focus so keyboard shortcuts work, without breaking in-place editing
    if (graph) {
        graph.addListener(InternalEvent.CLICK, (_sender: string, evt: EventObject) => {
            const cell = evt.getProperty('cell') as Cell | null;
            if (!cell && !graph.isEditing()) {
                returnFocusToGraph();
            }
        });
        graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
            if (!graph.isEditing()) {
                returnFocusToGraph();
            }
        });
    }

    const graphListener = useCallback((graph: Graph): (() => void) => {
        const goalLinkClickHandler = (_sender: string, evt: EventObject) => {
            const cell = evt.getProperty("cell") as Cell ?? null;
            if (!cell) return;

            const url = getGoalLinkForCell(cell);
            const mouseEvent = evt.getProperty("event") as MouseEvent | undefined;
            const eventTarget = mouseEvent?.target as Node | null;
            const labelNode = graph.getView().getState(cell)?.text?.node;

            // Only the label acts as a link; the surrounding symbol keeps its
            // existing selection, drag, resize and edit behaviour.
            if (!url || !eventTarget || !labelNode?.contains(eventTarget)) return;

            window.open(url, "_blank", "noopener,noreferrer");
            evt.consume();
        };
        const changeHandler = (_sender: string, evt: EventObject) => {
                const {changes} = evt.getProperty("edit") as UndoableEdit;
                graph.getDataModel().beginUpdate();
                evt.consume();
                try {
                    for (const change of changes) {
                        if (change instanceof GeometryChange) {
                            const cell = change.cell;
                            const cellID = cell.getId();
                            // Only persist user-initiated drags; skip events fired during renderGraph.
                            if (!isRenderingRef.current && isGoalRefId(cellID)) {
                                const geo = cell.getGeometry();
                                if (geo !== null && change.previous &&
                                    geo.width === change.previous.width && geo.height === change.previous.height &&
                                    (geo.x !== change.previous.x || geo.y !== change.previous.y)) {
                                    parseGoalRefId(cellID).forEach(({instanceId}) => {
                                        dispatch(updatePositionForInstanceId({instanceId, x: geo.x, y: geo.y}));
                                    });
                                }
                            }
                        }
                        else if (change instanceof ValueChange) {
                            const {cell, value} = change;
                            const cellID = cell.getId();
                            if (!isGoalRefId(cellID) || typeof value !== "string") continue;

                            if (isGoalNameEmpty(value)) {
                                graph.getDataModel().setValue(cell, change.previous);
                                setErrorModal({
                                    show: true,
                                    title: "Input Error",
                                    message: "Goal name cannot be empty.",
                                    onHide: () => setErrorModal(prev => ({...prev, show: false}))
                                });
                                return;
                            }

                            const numericCellIds = getCellNumericIds(cell);
                            const newGoalValues = isNonFunctionCell(cell)
                                ? convertEditingValueToList(value)
                                : [value];

                            // Check if the number of items matches
                            const nUpdated = numericCellIds.length;
                            const hasEmptyGoal = newGoalValues.some(isGoalNameEmpty);
                            if (nUpdated !== newGoalValues.length || hasEmptyGoal) {
                                graph.getDataModel().setValue(cell, change.previous);
                                setErrorModal({
                                    show: true,
                                    title: "Input Error",
                                    message: hasEmptyGoal ? "Goal name cannot be empty."
                                        : `Please provide ${nUpdated} ${(nUpdated === 1) ? "item" : "items"} separated by commas. Put double quotes around an item containing a comma.`,
                                    onHide: () => setErrorModal(prev => ({...prev, show: false}))
                                });
                            } else {
                                // The graph value has already changed, so its next
                                // layout snapshot alone cannot detect this edit.
                                editedCellIdsRef.current.add(cellID);
                                numericCellIds.forEach((instanceId, i) => {
                                    dispatch(updateTextForInstanceId({instanceId, text: newGoalValues[i]}));
                                });
                            }
                        }
                    }
                } finally {
                    graph.getDataModel().endUpdate();
                    // maxGraph updates the view for model changes. A full refresh
                    // would recreate the label that the active editor has hidden.
                }
            };
        graph.addListener(InternalEvent.CLICK, goalLinkClickHandler);
        graph.getDataModel().addListener(InternalEvent.CHANGE, changeHandler);
        return () => {
            graph.removeListener(goalLinkClickHandler);
            graph.getDataModel().removeListener(changeHandler);
        };
    }, [dispatch]);

    /**
     * Support Functions
     *
     * These are functions added to the renderer largely for the convenience
     * of the user. They're primarily to assist with manually adjusting the
     * model after it's been rendererd.
     * (1) Delete
     * (2) Undo
     */

    const supportFunctions = (graph: Graph) => {
        // delete: add key-handler that listens for 'delete' key
        const keyHandler = new GoalKeyHandler(graph);
        keyHandler.bindKey(DELETE_KEYBINDING, () => {
            if (graph.isEnabled()) {

                const selectedCells = graph.getSelectionCells();
                if (!selectedCells || selectedCells.length === 0) return;

                setDeletingCells(selectedCells);

                const outgoingEdges = childrenOfSelectedCell(graph, selectedCells[0]);
                const nAssociatedGoal = outgoingEdges.length;
                // setRemoveChildren(hasChildren);
                if (nAssociatedGoal > 0) {
                    setShowDeleteWarning(true)
                } else {
                    deleteItemFromGraph(graph, false, selectedCells);
                }

                // const cells = graph.removeCells(); // no arguments, internally take all selected ones and delete, and return th deleted cells as an array
                // graph.removeStateForCell(cells[0]);
                // cells.forEach(cell => {
                //   dispatch(removeGoalIdFromTree({ id: Number(cell.getId()),removeChildren:true})); // or with removeChildren
                // });
                // graph.removeCells(cells, true); remove children
                // graph.removeStateForCell(cells[0]); // ERROR ON CONSOLE LOG, but can delete cells and text redundant
            }
        });
        keyHandler.bindKey(DELETE_KEYBINDING2, () => {
            if (graph.isEnabled()) {
                const cells = graph.removeCells();
                graph.removeStateForCell(cells[0]); // ERROR ON CONSOLE LOG, but can delete cell and text
            }
        });

        // undo: add undo manager, this is the object that keeps track of the
        //   history of changes made to the graph
        const undoManager = new UndoManager();
        const listener = (_sender: string, evt: EventObject) => {
            undoManager.undoableEditHappened(evt.getProperty("edit"));
        };

        // undo: for some reason the undo listener has to be added to both the view
        //   and the model
        graph.getDataModel().addListener(InternalEvent.UNDO, listener);
        graph.getView().addListener(InternalEvent.UNDO, listener);

        keyHandler.bindControlKey(UNDO_KEYBINDING, () => {
            // Keep the initial graph creation outside the user's undo range.
            if (undoManager.indexOfNextAdd > 1) undoManager.undo();
        });

        return () => {
            keyHandler.onDestroy();
            graph.getDataModel().removeListener(listener);
            graph.getView().removeListener(listener);
        };
    };

    /**
     * Sidebar
     */

    // config: allow cells to be dropped into the graph canvas at arbitrary points
    //   This is necessary for the drag-and-drop functionality of the sidebar

    DragSource.prototype.getDropTarget = (
        graph: Graph,
        x: number,
        y: number
    ): Cell | null => {
        const cell = graph.getCellAt(x, y);
        return cell && !graph.isValidDropTarget(cell) ? cell : null;
    };

    const resetGraph = (
        graph: Graph,
        rootGoalWrapper: { value: Cell | null },
        emotionsGlob: GlobObject,
        negativesGlob: GlobObject,
        qualitiesGlob: GlobObject,
        stakeholdersGlob: GlobObject
    ) => {
        // Reset - remove any existing graph if render is called
        graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
        graph.removeCells(graph.getChildEdges(graph.getDefaultParent()));

        // Reset the root goal
        rootGoalWrapper.value = null;

        // Clear the accumulators for non-functional goals
        Object.keys(emotionsGlob).forEach(key => delete emotionsGlob[key]);
        Object.keys(negativesGlob).forEach(key => delete negativesGlob[key]);
        Object.keys(qualitiesGlob).forEach(key => delete qualitiesGlob[key]);
        Object.keys(stakeholdersGlob).forEach(key => delete stakeholdersGlob[key]);
    };

    const renderGraph = useCallback(() => {
        if (!graph) return;
        const goalGeometry = captureGoalGeometry(graph);
        const editedCellIds = new Set(editedCellIdsRef.current);
        const selectedIds = graph.getSelectionCells().map((cell) => cell.getId());
        // Declare necessary variables
        // Use rootGoalWrapper to be able to update its value
        let rootGoal: Cell | null = null;
        const rootGoalWrapper = {value: null as Cell | null};
        const emotionsGlob: GlobObject = {};
        const negativesGlob: GlobObject = {};
        const qualitiesGlob: GlobObject = {};
        const stakeholdersGlob: GlobObject = {};

        isRenderingRef.current = true;
        resetGraph(
            graph,
            rootGoalWrapper,
            emotionsGlob,
            negativesGlob,
            qualitiesGlob,
            stakeholdersGlob
        );

        // Check if the browser is supported
        if (!Client.isBrowserSupported()) {
            error("Browser not supported!", 200, false);
            isRenderingRef.current = false;
            return;
        }

        // Start the transaction to render the graph
        graph.getDataModel().beginUpdate();

        // render functional goals
        renderGoals(
            cluster.ClusterGoals,
            graph,
            null,
            rootGoalWrapper,
            emotionsGlob,
            negativesGlob,
            qualitiesGlob,
            stakeholdersGlob
        );
        rootGoal = rootGoalWrapper.value;
        layoutFunctions(graph);
        restoreSavedPositions(graph, cluster.ClusterGoals);

        // render non-functional goals
        associateNonFunctions(
            cluster.ClusterGoals,
            graph,
            rootGoal,
            emotionsGlob,
            negativesGlob,
            qualitiesGlob,
            stakeholdersGlob,
            showLineBetweenNonFunctionalGoals
        );
        // Restore tree positions before applying the more complete saved layout.
        restoreSavedPositions(graph, cluster.ClusterGoals);
        // A newly opened model owns its saved layout, not snapshots from the
        // previous model. Apply once so later manual resizing is not undone.
        let changedLabelCells: Cell[] = [];
        const isNewLayout = appliedLayoutRef.current?.functional !== functionalLayout
            || appliedLayoutRef.current?.nonFunctional !== nonFunctionalLayout;
        if (isNewLayout) {
            applyGoalLayout(graph, nonFunctionalLayout);
            applyGoalLayout(graph, functionalLayout);
            appliedLayoutRef.current = {functional: functionalLayout, nonFunctional: nonFunctionalLayout};
        } else {
            changedLabelCells = restoreGoalGeometry(
                graph,
                goalGeometry,
                editedCellIds,
                {
                    hierarchyUnchanged: hasSameGoalHierarchy(renderedTreeRef.current, treeData),
                    hasSavedLayout: Object.keys(nonFunctionalLayout).length > 0 || Object.keys(functionalLayout).length > 0,
                }
            );
        }

        graph.getDataModel().endUpdate();
        // Measure the latest labels only after restored geometry/font render.
        const newDoCells = graph.getChildVertices(graph.getDefaultParent()).filter(cell =>
            isDoCell(cell) && (isNewLayout || !goalGeometry.has(cell.getId()!)));
        const cellsToFit = new Set([...changedLabelCells, ...newDoCells]);
        const resizedLabels = Array.from(cellsToFit, cell => ({
            cell,
            geometry: getGeometryToFitLabel(graph, cell, graph.getCellStyle(cell).fontSize ?? VERTEX_FONT.size),
        }));
        graph.batchUpdate(() => {
            resizedLabels.forEach(({cell, geometry}) => {
                if (geometry) graph.getDataModel().setGeometry(cell, geometry);
            });
        });
        editedCellIdsRef.current.clear();
        renderedTreeRef.current = treeData;
        graph.setSelectionCells(selectedIds
            .map((id) => id ? graph.getDataModel().getCell(id) : undefined)
            .filter((cell): cell is Cell => !!cell));
        isRenderingRef.current = false;
    }, [graph, cluster, treeData, showLineBetweenNonFunctionalGoals, nonFunctionalLayout, functionalLayout]);

    // First useEffect to set up graph. Only run on mount.
    useEffect(() => {
        const graphContainer: HTMLElement | undefined =
            divGraph.current || undefined;

        if (graphContainer) {
            InternalEvent.disableContextMenu(graphContainer);

            const plugins = [
                ...getDefaultPlugins().map(plugin =>
                    plugin.pluginId === CellEditorHandler.pluginId ? GoalCellEditorHandler : plugin),
                RubberBandHandler,
            ];

            // Creates the graph with the custom plugins
            const graphInstance = new GoalGraph(graphContainer, undefined, plugins);
            setGraphStyle(graphInstance);
            const removeChangeListener = graphListener(graphInstance);
            fixEditorPosition(graphInstance);
            const removeKeyboardHandlers = supportFunctions(graphInstance);
            registerCustomShapes();
            setGraph(graphInstance);

            return () => {
                removeChangeListener();
                removeKeyboardHandlers();
                graphInstance.destroy();
                setGraph(null);
            };
        }
    }, [graphListener, setGraph]);

    // Separate useEffect to render / update the graph.
    useEffect(() => {
        if (graph) {
            const previous = previousRenderRef.current;
            // Recolour existing cells without rerunning layout
            const coloursUpdated = previous?.graph === graph &&
                appliedLayoutRef.current?.nonFunctional === nonFunctionalLayout &&
                appliedLayoutRef.current?.functional === functionalLayout &&
                previous.showLines === showLineBetweenNonFunctionalGoals &&
                updateGoalColours(graph, previous.cluster.ClusterGoals, cluster.ClusterGoals);
            if (!coloursUpdated && cluster.ClusterGoals.length > 0) {
                renderGraph();
            }
            else if (!coloursUpdated) {
                graph.getDataModel().clear();
            }
            previousRenderRef.current = {graph, cluster, showLines: showLineBetweenNonFunctionalGoals};
        }
    }, [cluster, graph, renderGraph, showLineBetweenNonFunctionalGoals]);

    // Auto-center when goals in the canvas change (e.g. new goal added)
    useEffect(() => {
        const currentCount = cluster.ClusterGoals.length;
        const prevCount = prevClusterGoalsCountRef.current;

        if (showGraphSection && currentCount > prevCount && graph) {
            requestAnimationFrame(() => {
                recentreView(graph);
            });
        }

        prevClusterGoalsCountRef.current = currentCount;
    }, [cluster.ClusterGoals.length, showGraphSection, graph]);

    // Auto-center when entering render section (every time, not just first entry)
    useEffect(() => {
        if (!showGraphSection || !graph || !divGraph.current) return;

        const container = divGraph.current;
        let lastBounds: { width: number; height: number } | null = null;

        const observer = new ResizeObserver(() => {
            const bounds = graph.getGraphBounds();
            if (!bounds) return;

            const {width, height} = bounds;

            // Wait until graph has valid size
            if (width > 0 && height > 0) {

                // Check if bounds are stable (same as last frame)
                if (lastBounds && lastBounds.width === width && lastBounds.height === height) {
                    // Graph is finalized -> center and stop observing
                    recentreView(graph);
                    observer.disconnect();
                } else {
                    // Store bounds for next frame
                    lastBounds = {width, height};
                }
            }
        });

        observer.observe(container);

        return () => observer.disconnect();
    }, [showGraphSection, graph]);


    // --------------------------------------------------------------------------------------------------------------------------------------------------
    const nAssociatedGoal =
        deletingCells && graph
            ? childrenOfSelectedCell(graph, deletingCells[0]).length
            : 0;

    return (
        <div style={{position: "relative", width: "100%", height: "100%"}}>
            <ErrorModal {...errorModal} />
            <ConfirmModal
                show={showDeleteWarning}
                title="Delete goal with children"
                message={
                    <>
                        The selected goal has {nAssociatedGoal} associated {(nAssociatedGoal === 1) ? 'goal' : 'goals'}
                        <br />
                        Choose below if you also want to delete them.
                    </>
                }
                onHide={() => setShowDeleteWarning(false)}
                onConfirm={() => {
                    if (graph && deletingCells) {
                        deleteItemFromGraph(graph, removeChildren, deletingCells);
                    } else {
                        console.warn("Graph not initialized yet");
                    }
                    setShowDeleteWarning(false);
                }}
                extraContent={
                    <Form.Check
                        type="checkbox"
                        label="Delete associated goal(s)"
                        checked={removeChildren}
                        onChange={(e) => setRemoveChildren(e.target.checked)}
                    />
                }
            />
            <Container className="h-100">
                <Row className="graph-worker-row">
                    <Col className="h-100" md={10}>
                        <div id={GRAPH_DIV_ID} data-cy="graph-canvas" ref={divGraph} tabIndex={0} style={{outline: 'none'}} />
                    </Col>
                    <Col className="h-100 overflow-auto" md={2}>
                        <GraphSidebar
                            graph={graph}
                            recentreView={() => graph && recentreView(graph)}
                        />
                    </Col>
                </Row>
                {(cluster.ClusterGoals.length > 0) && (!hasFunctionalGoalInCluster) && (
                    <WarningMessage message="No functional goals found" />
                )}
            </Container>
        </div>
    );
};

// ---------------------------------------------------------------------------

export default GraphWorker;
