import {
    Cell,
    CellStyle,
    Client,
    DragSource,
    error,
    EventObject,
    getDefaultPlugins,
    Graph,
    InternalEvent,
    KeyHandler,
    RubberBandHandler,
    UndoManager,
} from "@maxgraph/core";
import '@maxgraph/core/css/common.css';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import ErrorModal, { ErrorModalProps } from "../ErrorModal.tsx";
import { associateNonFunctions, layoutFunctions, renderGoals } from './GraphHelpers';
import {
  registerCustomShapes,
} from "./GraphShapes";
import "./GraphWorker.css";
import {useFileContext} from "../context/FileProvider.tsx";
import {useGraph} from "../context/GraphContext";
import {Cluster} from "../types.ts";
import GraphSidebar from "./GraphSidebar";
import WarningMessage from "./WarningMessage";

import {VERTEX_FONT} from "../utils/GraphConstants.tsx"
import {removeGoalIdFromTree} from "../context/treeDataSlice.ts";
import ConfirmModal from "../ConfirmModal.tsx";
import { returnFocusToGraph } from "../utils/GraphUtils.tsx";

// ---------------------------------------------------------------------------

//Graph id & Side bar id
const GRAPH_DIV_ID = "graphContainer";

// keybinding for the 'delete' key on MacOS; this is used in the implementation
//   of the delete function
const DELETE_KEYBINDING = 8;
const DELETE_KEYBINDING2 = 46;

// ---------------------------------------------------------------------------

interface CellHistory {
  [cellID: string]: [width: number | undefined, height: number | undefined];
}

interface GlobObject {
  [key: string]: string[];
}

// ---------------------------------------------------------------------------

const GraphWorker: React.FC<{ showGraphSection?: boolean }> = ({ showGraphSection = false }) => {
  const divGraph = useRef<HTMLDivElement>(null);
  const {cluster, dispatch} = useFileContext();
  const {graph, setGraph} = useGraph();


  const hasFunctionalGoal = (cluster: Cluster) => (
      cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional")
  );
  const hasFunctionalGoalInCluster = useMemo<boolean>(() => hasFunctionalGoal(cluster), [cluster]);

  const [errorModal, setErrorModal] = useState<ErrorModalProps>({
    show: false,
    title: "",
    message: "",
    onHide: () => setErrorModal(prev => ({ ...prev, show: false })),
  });


  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [removeChildren, setRemoveChildren] = useState(false);
  const deletingItemRef = useRef<Cell[] | null>(null);


const deleteItemFromGraph = (graph:Graph, removeChildrenFlag: boolean) => {
  const cells = deletingItemRef.current
  console.log("removeCellRecursively: selected ",cells)
  if(!cells||!graph) return
  const deletedCells: Cell[] = [];
  
  // selected cell
  const removeCellRecursively = (cell: Cell) => {
    
    console.log("removeCellRecursively: iterate ",cell)
    // check the children
    const outgoingEdges = graph.getOutgoingEdges(cell,null);

    if (removeChildrenFlag && outgoingEdges.length) {
      outgoingEdges.forEach(edge => {
        if (edge.target) removeCellRecursively(edge.target);
      });
    }
    const removed = graph.removeCells([cell], removeChildrenFlag);
    console.log("removeCellRecursively: removed ",removed)
    deletedCells.push(...removed);
  };

  cells.forEach(cell => 
      removeCellRecursively(cell));
  deletedCells.forEach((cell) => {
    // since the cell.getID is functionatype + the id

    const idStr = cell.getId(); // i.e "Functional-8"
    const numericId = Number(idStr?.split("-").pop()); // 8
    dispatch(removeGoalIdFromTree({ id: numericId, removeChildren: removeChildrenFlag }));
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
  
  // Track if we have already centered on first entry
  const hasCenteredOnEntryRef = useRef(false);
  const prevShowGraphSectionRef = useRef(false);



  const recentreView = () => {
    if (graph) {
      graph.fit();
      graph.center();
    }
    console.log("center")
  };
  
  const initRecentreView = useCallback(() => {
    if (graph) {
      graph.fit();
      graph.center();
    }
    console.log("center")
  }, [graph]);

  const adjustFontSize = (
    theOldStyle: CellStyle,
    oldWidth: number,
    oldHeight: number,
    newWidth: number,
    newHeight: number
  ) => {
    const oldFontSize = theOldStyle.fontSize;
    let newFontSize;
    let oldRatio;

    if (oldFontSize) {
      if (oldWidth / oldHeight > 1.4) {
        oldRatio = oldFontSize / oldHeight;
      } else {
        oldRatio = oldFontSize / oldWidth;
      }

      if (newWidth / newHeight > 1.4) {
        newFontSize = oldRatio * newHeight;
      } else {
        newFontSize = oldRatio * newWidth;
      }
    } else {
      return oldFontSize;
    }
    return newFontSize;
  };

  const setGraphStyle = (graph: Graph) => {
    // config: permit vertices to be connected by edges
    //graph.setConnectable(true);
    graph.setCellsEditable(true);
    graph.setPanning(true);
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

  const graphListener = useCallback((graph: Graph) => {
    const cellHistory: CellHistory = {};
    graph
      .getDataModel()
      .addListener(InternalEvent.CHANGE, (_sender: string, evt: EventObject) => {
        console.log("graph changed");
        graph.getDataModel().beginUpdate();
        evt.consume();
        try {
          const changes = evt.getProperty("edit").changes;
          for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            if (change.constructor.name == "GeometryChange") {
              const cell: Cell = changes[i].cell;
              const cellID = cell.getId();
              console.log("change, ",cell)
              const oldStyle = cell.getStyle();
              const newWidth = cell.getGeometry()?.height;
              const newHeight = cell.getGeometry()?.width;

              if (cellID != null && cellHistory[cellID] == undefined) {
                cellHistory[cellID] = [newWidth, newHeight];
              } else {
                if (cellID != null) {
                  const oldWidth = cellHistory[cellID][0];
                  const oldHeight = cellHistory[cellID][1];
                  if (oldWidth && oldHeight && newWidth && newHeight) {
                    let newFontSize =
                      adjustFontSize(
                        oldStyle,
                        oldWidth,
                        oldHeight,
                        newWidth,
                        newHeight
                      ) || 1;

                    const minFontsize = 10;
                    const maxFontsize = 30;
                    newFontSize = Math.max(minFontsize, newFontSize);
                    newFontSize = Math.min(maxFontsize, newFontSize);

                    const finalStyle: CellStyle = oldStyle;
                    finalStyle.fontSize = newFontSize;

                    graph.getDataModel().setStyle(cell, finalStyle);
                  }
                }
              }
              if (cellID) {
                cellHistory[cellID] = [newWidth, newHeight];
              }
            }
            else if (change.constructor.name == "ValueChange") {
              const cell: Cell = change.cell;
              // goal id
              const cellID = cell.getId()?.split(",") ?? [];
              // goal value
              const newContent = change.value.split(",");

              const lengthUpdated = cellID.length
              // Check if the number of items matches
              if (lengthUpdated !== newContent.length) {
                graph.getDataModel().setValue(cell, change.previous);
                setErrorModal({
                  show: true,
                  title: "Input Error",
                  message: `Please provide ${lengthUpdated} items split by comma`,
                  onHide: () => setErrorModal(prev => ({ ...prev, show: false }))
                });
              } else {
                for (let i = 0; i < lengthUpdated; i++) {
                  const id = Number(cellID[i]);
                  const text = newContent[i].trim("");

                  console.log("FileProvider state updated: cellid: ", id);
                  console.log("FileProvider state updated: content: ", text);

                  dispatch({
                    type: "treeData/updateTextForGoalId",
                    payload: {
                      id,
                      text,
                    },
                  });
                }
              }


            }
          }

        } finally {
          graph.getDataModel().endUpdate();
          graph.refresh();
        }
      });
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
    const keyHandler = new KeyHandler(graph);
    keyHandler.bindKey(DELETE_KEYBINDING, () => {
      if (graph.isEnabled()) {
        
        const selectedCells = graph.getSelectionCells();
        if (!selectedCells || selectedCells.length === 0) return;

        deletingItemRef.current = selectedCells;

      

        const outgoingEdges = graph.getOutgoingEdges(selectedCells[0],null);
        const hasChildren = outgoingEdges.some(edge => edge.target && edge.target !== selectedCells[0]);

        // setRemoveChildren(hasChildren);
        if (hasChildren) {
          setShowDeleteWarning(true);
        } else {
          deleteItemFromGraph(graph,false);
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
        console.log("--------------- DELETE CELL ---------------");
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

    // undo: add key-handler that listens for 'command'+'z' to execute undo
    const undoKeyHandler = new KeyHandler(graph);
    undoKeyHandler.getFunction = (evt: KeyboardEvent) => {
      // if mac command key pressed ...
      if (Client.IS_MAC && evt.metaKey) {
        // ... and z pressed
        if (evt.code === "KeyZ") {
          // ... and provided that we have some history to undo
          //   DO NOT DELETE : removing this guard can crash the web browser
          if (undoManager.indexOfNextAdd > 1) {
            // ... then we can execute undo
            undoManager.undo();
          }
        }
        // if windows control key pressed ...
      } else if (Client.IS_WIN && evt.ctrlKey) {
        if (evt.code === "KeyZ") {
          // ... and provided that we have some history to undo
          //   DO NOT DELETE : removing this guard can crash the web browser
          if (undoManager.indexOfNextAdd > 1) {
            // ... then we can execute undo
            undoManager.undo();
          }
        }
      }
      return null;
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
    // console.log("getDrop Target in ==========================")
    // console.log(x,y)
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

    console.log("Rendering Graph");

    // Declare necessary variables
    // Use rootGoalWrapper to be able to update its value
    let rootGoal: Cell | null = null;
    const rootGoalWrapper = { value: null as Cell | null };
    const emotionsGlob: GlobObject = {};
    const negativesGlob: GlobObject = {};
    const qualitiesGlob: GlobObject = {};
    const stakeholdersGlob: GlobObject = {};

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
      console.log("Logging: browser not supported");
      error("Browser not supported!", 200, false);
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
    layoutFunctions(graph, rootGoal);

    // render non-functional goals
    associateNonFunctions(
      graph,
      rootGoal,
      emotionsGlob,
      negativesGlob,
      qualitiesGlob,
      stakeholdersGlob
    );
    graph.getDataModel().endUpdate();
  }, [graph, cluster, initRecentreView]);

  // First useEffect to set up graph. Only run on mount.
  useEffect(() => {
    const graphContainer: HTMLElement | undefined =
      divGraph.current || undefined;

    if (graphContainer) {
      InternalEvent.disableContextMenu(graphContainer);
  
      const plugins = [
        ...getDefaultPlugins(), 
        RubberBandHandler,
      ];
      
      // Creates the graph with the custom plugins
      const graphInstance = new Graph(graphContainer, undefined, plugins);

      setGraphStyle(graphInstance);
      graphListener(graphInstance);
      supportFunctions(graphInstance);
      registerCustomShapes();
      setGraph(graphInstance);

      // Cleanup function to destroy graph
      return () => {
        if (graphInstance) {
          console.log("Destroy");
          graphInstance.destroy(); 
        }
        setGraph(null); // Reset state
      };
    }
  }, [graphListener, setGraph]);

  // Separate useEffect to render / update the graph.
  useEffect(() => {
    if (graph) {
      // If user has goals defined, draw the graph
      if (cluster.ClusterGoals.length > 0) {
        console.log("re render");
        renderGraph();
        // Restore focus after rendering to enable Delete key functionality
        // Set the focus after the graph section render finished
        if (showGraphSection) {
          returnFocusToGraph();
        }
      }
      else {
        graph.getDataModel().clear();
        console.log("Graph is empty");
      }
    }
  }, [cluster, graph, renderGraph, showGraphSection]);

  // Trigger centering when entering render section
  useEffect(() => {
    console.log("useEffect triggered:", {
      showGraphSection,
      prevShowGraphSection: prevShowGraphSectionRef.current,
      hasGraph: !!graph,
      goalsLength: cluster.ClusterGoals.length,
      hasCentered: hasCenteredOnEntryRef.current
    });

    // Only center when showGraphSection changes from false to true
    if (showGraphSection && !prevShowGraphSectionRef.current && graph && cluster.ClusterGoals.length > 0 && !hasCenteredOnEntryRef.current) {
      console.log("Centering graph on first entry");
      // Use setTimeout to ensure centering happens after layout is complete
      setTimeout(() => {
        initRecentreView();
        // Set focus after navigation to enable keyboard shortcuts
        returnFocusToGraph();
      }, 200);
      hasCenteredOnEntryRef.current = true;
    }

    // Update previous value
    prevShowGraphSectionRef.current = showGraphSection;
  }, [showGraphSection, graph, cluster.ClusterGoals.length, initRecentreView]);

  // --------------------------------------------------------------------------------------------------------------------------------------------------

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ErrorModal {...errorModal} />
      <ConfirmModal
        show={showDeleteWarning}
        title="Delete goal with children"
        message="The selected goal has children. Confirm you want to delete this goal"
        onHide={() => setShowDeleteWarning(false)}
        onConfirm={() => {
          if (graph) {
            deleteItemFromGraph(graph, removeChildren);
          } else {
            console.warn("Graph not initialized yet");
          }
          setShowDeleteWarning(false);
        }}
        extraContent={
          <Form.Check
            type="checkbox"
            label="Delete all children goals"
            checked={removeChildren}
            onChange={(e) => setRemoveChildren(e.target.checked)}
          />
        }
      />
      <Container>
        <Row className="row">
          <Col md={10}>
            <div id={GRAPH_DIV_ID} ref={divGraph} tabIndex={0} style={{outline: 'none'}}/>
          </Col>
          <Col md={2}>
            <GraphSidebar graph={graph} recentreView={recentreView} />
          </Col>
        </Row>
      {(cluster.ClusterGoals.length > 0) && (!hasFunctionalGoalInCluster) && (
          <WarningMessage message="No functional goals found"/>
      )}
      </Container>
    </div>
  );
};

// ---------------------------------------------------------------------------

export default GraphWorker;
