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
  xmlUtils,
  Codec,
  ModelXmlSerializer,
} from "@maxgraph/core";
import {GoalModelLayout} from "./GoalModelLayout";
import {useRef, useEffect, useState, useMemo} from "react";
import {Container, Row, Col} from "react-bootstrap";
import { renderFunction, renderGoals, renderNonFunction, renderLegend, layoutFunctions, associateNonFunctions } from './GraphHelpers';
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
import ResetGraphButton from "../ResetGraphButton.tsx";
import { useGraph } from "../context/GraphContext";
import {Cluster, ClusterGoal} from "../types.ts";

// ---------------------------------------------------------------------------

//Graph id & Side bar id
const GRAPH_DIV_ID = "graphContainer";

// keybinding for the 'delete' key on MacOS; this is used in the implementation
//   of the delete function
const DELETE_KEYBINDING = 8;
const DELETE_KEYBINDING2 = 46;

// preferred vertical and horizontal spacing between functional goals; note
//   the autolayout won't always accomodate these - it will depend on the
//   topology of the model you are trying to render
const VERTICAL_SPACING = 80;
const HORIZONTAL_SPACING = 100;

// Define shape type
const FUNCTIONAL_TYPE = "Functional";
const EMOTIONAL_TYPE = "Emotional";
const NEGATIVE_TYPE = "Negative";
const QUALITY_TYPE = "Quality";
const STAKEHOLDER_TYPE = "Stakeholder";


// Predefined constant cluster to use for the example graph
const defaultCluster: Cluster = {
  ClusterGoals: [{
      GoalID: 1,
      GoalType: "Functional",
      GoalContent: "Functional Goal",
      GoalNote: "",
      SubGoals: [{
          GoalID: 6,
          GoalType: "Functional",
          GoalContent: "Functional Goal",
          GoalNote: "",
          SubGoals: [{
              GoalID: 7,
              GoalType: "Functional",
              GoalContent: "Functional Goal",
              GoalNote: "",
              SubGoals: []
            }
          ]
        }, {
          GoalID: 8,
          GoalType: "Functional",
          GoalContent: "Functional Goal",
          GoalNote: "",
          SubGoals: []
        }
      ]
    }, {
      GoalID: 2,
      GoalType: "Quality",
      GoalContent: "Quality Goals",
      GoalNote: "",
      SubGoals: []
    }, {
      GoalID: 3,
      GoalType: "Emotional",
      GoalContent: "Emotional Goals",
      GoalNote: "",
      SubGoals: []
    }, {
      GoalID: 4,
      GoalType: "Stakeholder",
      GoalContent: "Stakeholders ",
      GoalNote: "",
      SubGoals: []
    }, {
      GoalID: 5,
      GoalType: "Negative",
      GoalContent: "Negatives",
      GoalNote: "",
      SubGoals: []
    }
  ]
};

// random string, used to store unassociated non-functions in accumulators
const ROOT_KEY = "0723y450nv3-2r8mchwouebfioasedfiadfg";

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
};

// ---------------------------------------------------------------------------

const GraphWorker: React.FC<GraphWorkerProps> = ({ cluster, onResetEmpty }) => {
  //   const divSidebar = useRef<HTMLDivElement>(null);
  const divGraph = useRef<HTMLDivElement>(null);
  const {graph, setGraph} = useGraph();
  const [isDefaultReset, setIsDefaultReset] = useState(true);


  const hasFunctionalGoal = (cluster: Cluster) => (
      cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional")
  );
  const hasFunctionalGoalInCluster = useMemo<boolean>(() => hasFunctionalGoal(cluster), [cluster]);

   // Function to reset the graph to empty
   const resetEmptyGraph = () => {
    if (graph) {
      graph.getDataModel().clear();
      onResetEmpty();
      setIsDefaultReset(false);
    }
  };

  // Function to reset the graph to the default set of goals
  const resetDefaultGraph = () => {
    if (graph) {
      graph.getDataModel().clear();
      onResetEmpty();
      setIsDefaultReset(true);
    }
  };

  const recentreView = () => {
    if (graph) {
      graph.fit();
      graph.center();
    }
    console.log("center")
  };
  
  const initRecentreView = () => {
    if (graph) {
      graph.view.setScale(1);
      graph.center();
    }
    console.log("center")
  };

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
    const panningHandler = graph.getPlugin("PanningHandler") as PanningHandler;
    panningHandler.useLeftButtonForPanning = true;

    // config: allow symbols to be dropped into the graph (used for sidebar) (automatically enabled in @maxgraph/core)
    // graph.dropEnabled = true

    // config: permit vertices to be connected by edges
    graph.setConnectable(true);
    graph.setCellsEditable(true);
    graph.setPanning(true);
    graph.setCellsResizable(true);
    graph.setCellsMovable(true); // Allow cells to be moved
    graph.setCellsSelectable(true); // Allow cells to be selected

    // Ensure pointer events are enabled
    graph.container.style.cursor = "default";
    graph.container.style.pointerEvents = "all";

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
    nodeStyle.autoSize = true;
    nodeStyle.spacing = 10;
    nodeStyle.spacingLeft = 10;
    nodeStyle.spacingRight = 10;
    nodeStyle.editable = true;
    graph.getStylesheet().putDefaultVertexStyle(nodeStyle);
  };

  const graphListener = (graph: Graph) => {
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
  };

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
    // reset - remove any existing graph if render is called
    graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
    graph.removeCells(graph.getChildEdges(graph.getDefaultParent()));
    rootGoalWrapper = { value: null};

    // reset the accumulators for non-functional goals
    emotionsGlob = {};
    negativesGlob = {};
    qualitiesGlob = {};
    stakeholdersGlob = {};

  };

  // Just renders an example graph
  const renderExampleGraph = () => {
    if (!graph) return;

    console.log("Rendering Example Graph");

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
      defaultCluster.ClusterGoals,
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
  };

  const renderGraph = () => {
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
  };

  // First useEffect to set up graph. Only run on mount.
  useEffect(() => {
    const graphContainer: HTMLElement | undefined =
      divGraph.current || undefined;

    if (graphContainer) {
      InternalEvent.disableContextMenu(graphContainer);

      const graphInstance = new Graph(graphContainer); // Create the graph

      setGraphStyle(graphInstance);
      graphListener(graphInstance);
      supportFunctions(graphInstance);
      registerCustomShapes();
      setGraph(graphInstance);

      // Cleanup function to destroy graph
      return () => {
        if (graph) {
          console.log("Destroy");
          graph.destroy();
          setGraph(null); // Reset state
        }
      };
    }
  }, []);

  // Separate useEffect to render / update the graph.
  useEffect(() => {
    if (graph) {
      // If user has goals defined, draw the graph
      if (cluster.ClusterGoals.length > 0) {
        renderGraph();
      } 
      else if (isDefaultReset) {
        renderExampleGraph();
      }
    }
  }, [cluster, graph, renderExampleGraph, isDefaultReset]);

  /**
   * Parses the graph to XML, to be saved/loaded in a differenct session.
   */
  const parseToXML = (graph: Graph) => {
    const encoder = new Codec();
    const node = encoder.encode(graph.getDataModel());
    const xml = xmlUtils.getXml(node);    
    return xml;
  };

  /**
   * Renders the graph from a (saved) XML file.
   */

  const renderFromXML = (xml: string) => {
    if (!divGraph.current || !xml) return;

    const graph = new Graph(divGraph.current);
    graph.setPanning(true); // Use mouse right button for panning

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // WARN: this is an experimental feature that is subject to change (class and method names).
    // see https://maxgraph.github.io/maxGraph/api-docs/classes/ModelXmlSerializer.html
    new ModelXmlSerializer(graph.getDataModel()).import(xml);

    const doc = xmlUtils.parseXml(xml);

    const codec = new Codec(doc);
    const cells = [];

    for (let elt = doc.documentElement.firstChild; elt; elt = elt.nextSibling) {
      if (elt.nodeType === Node.ELEMENT_NODE) {
        const cell = codec.decode(elt as Element);

        cells.push(cell);
      }
    }

    graph.addCells(cells, parent, null, null, null);
  };


  // --------------------------------------------------------------------------------------------------------------------------------------------------

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ResetGraphButton resetEmptyGraph={resetEmptyGraph} resetDefaultGraph={resetDefaultGraph}></ResetGraphButton>
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
