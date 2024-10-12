import {
  CellStyle,
  Client,
  Graph,
  InternalEvent,
  DragSource,
  Cell,
  KeyHandler,
  UndoManager,
  EventObject,
  error,
  PanningHandler,
  RubberBandHandler,
  getDefaultPlugins,
} from "@maxgraph/core";
import '@maxgraph/core/css/common.css';

import {useRef, useEffect, useMemo, useCallback} from "react";
import {Container, Row, Col} from "react-bootstrap";
import { renderGoals, layoutFunctions, associateNonFunctions } from './GraphHelpers';
import "./GraphWorker.css";
import {
  registerCustomShapes,
  // NEGATIVE_SHAPE,
  // PERSON_SHAPE,
  // CLOUD_SHAPE,
  // PARALLELOGRAM_SHAPE,
  // HEART_SHAPE,
} from "./GraphShapes";

import GraphSidebar from "./GraphSidebar";
import WarningMessage from "./WarningMessage";
import ResetGraphButton from "./ResetGraphButton.tsx";
import ScaleTextButton from "./ScaleTextButton.tsx";
import { useGraph } from "../context/GraphContext";
import {Cluster} from "../types.ts";

// ---------------------------------------------------------------------------

//Graph id & Side bar id
const GRAPH_DIV_ID = "graphContainer";

// keybinding for the 'delete' key on MacOS; this is used in the implementation
//   of the delete function
const DELETE_KEYBINDING = 8;
const DELETE_KEYBINDING2 = 46;

// vertex default font size
const VERTEX_FONT_SIZE = 16;

// ---------------------------------------------------------------------------

interface CellHistory {
  [cellID: string]: [width: number | undefined, height: number | undefined];
}

interface GlobObject {
  [key: string]: string[];
}


type GraphWorkerProps = {
  cluster: Cluster;
  onResetEmpty: () => void; // Function to reset the graph to empty
  onResetDefault: () => void;
};

// ---------------------------------------------------------------------------

const GraphWorker: React.FC<GraphWorkerProps> = ({ cluster, onResetEmpty, onResetDefault }) => {
  const divGraph = useRef<HTMLDivElement>(null);
  const {graph, setGraph} = useGraph();

  const hasFunctionalGoal = (cluster: Cluster) => (
      cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional")
  );
  const hasFunctionalGoalInCluster = useMemo<boolean>(() => hasFunctionalGoal(cluster), [cluster]);

   // Function to reset the graph to empty
   const resetEmptyGraph = () => {
    if (graph) {
      onResetEmpty();
    }
  };

  // Function to reset the graph to the default set of goals
  const resetDefaultGraph = () => {
    if (graph) {
      onResetDefault();
    }
  };

  const recentreView = () => {
    if (graph) {
      graph.fit();
      graph.center();
    }
    console.log("center")
  };
  
  const initRecentreView = useCallback(() => {
    if (graph) {
      graph.view.setScale(1);
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
    graph.setConnectable(true);
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
    nodeStyle.fontSize = VERTEX_FONT_SIZE;
    nodeStyle.fontColor = "black";
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
            if (changes[i].constructor.name == "GeometryChange") {
              const cell: Cell = changes[i].cell;
              const cellID = cell.getId();

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
          }
        } finally {
          graph.getDataModel().endUpdate();
          graph.refresh();
        }
      });
  }, []);

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
        console.log("--------------- DELETE CELL ---------------");
        const cells = graph.removeCells();
        graph.removeStateForCell(cells[0]); // ERROR ON CONSOLE LOG, but can delete cells and text
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
    associateNonFunctions(
      graph,
      rootGoal,
      emotionsGlob,
      negativesGlob,
      qualitiesGlob,
      stakeholdersGlob
    );
    graph.getDataModel().endUpdate();
    initRecentreView();
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
      } 
      else {
        graph.getDataModel().clear();
        console.log("Graph is empty");
      }
    }
  }, [cluster, graph, renderGraph]);

  // --------------------------------------------------------------------------------------------------------------------------------------------------

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ResetGraphButton resetEmptyGraph={resetEmptyGraph} resetDefaultGraph={resetDefaultGraph}></ResetGraphButton>
      <ScaleTextButton></ScaleTextButton>
      <Container>
        <Row className="row">
          <Col md={11}>
            <div id={GRAPH_DIV_ID} ref={divGraph}/>
          </Col>
          <Col md={1}>
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
