import {
  CellStyle,
  Client,
  Graph,
  InternalEvent,
  CellStateStyle,
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
import ResetGraphButton from "../ResetGraph.tsx";
import { useGraph } from "../context/GraphContext";
import {Cluster, ClusterGoal, Goal} from "../types.ts";

// ---------------------------------------------------------------------------

//Graph id & Side bar id
const GRAPH_DIV_ID = "graphContainer";

// paths to the image
const HEART_PATH = "img/Heart.png";
const PARALLELOGRAM_PATH = "img/Function.png";
const NEGATIVE_PATH = "img/Risk.png";
const CLOUD_PATH = "img/Cloud.png";
const PERSON_PATH = "img/Stakeholder.png";

// some image path
// const PATH_EDGE_HANDLER_ICON = "img/link.png";

// default width/height of the root goal in the graph
const SYMBOL_WIDTH = 145;
const SYMBOL_HEIGHT = 110;

// vertex default font size
const VERTEX_FONT_SIZE = 16;

// default x,y coordinates of the root goal in the graph - (functional graph)
const SYMBOL_X_COORD = 0;
const SYMBOL_Y_COORD = 0;

// scale factor for sizing child goals in the functional hierarchy; functional
//   goals at each layer should be slightly smaller than their parents
const CHILD_SIZE_SCALE = 0.9;

// scale factor for sizing functional goals
const SH_PREFERRED = 1.1;
const SW_PREFERRED = 1.4;
const SH_FONT = 2.375; //scale factor for height base on font size

// scale factors for non-functional goals; these scale factors are relative
//   to the size of the associated functional goal
const SW_EMOTIONAL = 0.9;
const SH_EMOTIONAL = 0.96;
const SW_QUALITY = 1;
const SH_QUALITY = 0.8;
const SW_NEGATIVE = 0.9;
const SH_NEGATIVE = 0.96;
const SW_STAKEHOLDER = 1;
const SH_STAKEHOLDER = 1.2;

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


// random string, used to store unassociated non-functions in accumulators
const ROOT_KEY = "0723y450nv3-2r8mchwouebfioasedfiadfg";

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
  onResetDefault: () => void; // Function to reset the graph to default
};

// ---------------------------------------------------------------------------

const GraphWorker: React.FC<GraphWorkerProps> = ({ cluster, onResetEmpty, onResetDefault }) => {
  //   const divSidebar = useRef<HTMLDivElement>(null);
  const divGraph = useRef<HTMLDivElement>(null);
  const {graph, setGraph} = useGraph();
  const [showWarning, setShowWarning] = useState(false);
  //const [emptyReset, setEmptyReset] = useState(false);

  const hasFunctionalGoal = (cluster: Cluster) => (
      cluster.ClusterGoals.some((goal) => goal.GoalType === "Functional")
  );
  const hasFunctionalGoalInCluster = useMemo<boolean>(() => hasFunctionalGoal(cluster), [cluster]);

   // Function to reset the graph to empty
   const resetEmptyGraph = () => {
    if (graph) {
      graph.getDataModel().clear();
      //onResetEmpty();
      setShowWarning(false);
      //setEmptyReset(true);
    }
  };

  // Function to reset the graph to the default set of goals
  const resetDefaultGraph = () => {
    if (graph) {
      graph.getDataModel().clear();
      //onResetDefault();
      renderExampleGraph();
      setShowWarning(false);
      //setEmptyReset(false);
    }
  };

  const recentreView = () => {
    if (graph) {
      graph.fit();
      graph.center();
    }
    console.log("center")
  };
  
  // const recentreView = () => {
  //   if (graph) {
  //     graph.view.setScale(1);
  //     graph.center();
  //   }
  //   console.log("center")
  // };

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
      .addListener(InternalEvent.CHANGE, (sender: string, evt: EventObject) => {
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

  /**
   * Renders a functional goal. The most important thing that this
   * does is call renderGoals() over each of the goals children.
   * : goal, the goal to be rendered (a Goal JSON object)
   * : graph, the graph to render the goal into
   * : source, the parent of the goal
   */
  const renderFunction = (
    goal: ClusterGoal,
    graph: Graph,
    source: Cell | null = null,
    rootGoalWrapper: { value: Cell | null },
    emotionsGlob: GlobObject,
    negativesGlob: GlobObject,
    qualitiesGlob: GlobObject,
    stakeholdersGlob: GlobObject
  ) => {

    const arr = goal.GoalContent.split(" ");
    
    // styling
    const image = PARALLELOGRAM_PATH;
    let width = SYMBOL_WIDTH;
    let height = SYMBOL_HEIGHT;
    if (source) {
      const geo = source.getGeometry();
      if (geo) {
        width = geo.width * CHILD_SIZE_SCALE;
        height = geo.height * CHILD_SIZE_SCALE;
      }
    }

    // insert new vertex and edge into graph
    const node = graph.insertVertex(
      null,
      null,
      arr.join("\n"),
      SYMBOL_X_COORD,
      SYMBOL_Y_COORD,
      width,
      height,
      {
        fontSize: VERTEX_FONT_SIZE,
        fontColor: "black",
        shape: "image",
        image: image,
      }
    );
    graph.insertEdge(null, null, "", source, node);

    // if no root goal is registered, then store this as root
    if (rootGoalWrapper.value === null) {
      rootGoalWrapper.value = node;
      console.log("rootgoal registered", rootGoalWrapper.value);
    }

    //resize functional goal base on text length and number of lines
    const node_geo = node.getGeometry();
    const preferred = graph.getPreferredSizeForCell(node); //getPreferredSizeForCell only works for width
    if (node_geo && preferred) {
      node_geo.height = arr.length * VERTEX_FONT_SIZE * SH_FONT; //get height base on the number of lines in goal text and font size
      node_geo.width = Math.max(
        node_geo.height,
        preferred.width * SW_PREFERRED,
        width
      ); //image size is rendered base on min(height, width)
      node_geo.height = Math.max(
        node_geo.height,
        preferred.width * SH_PREFERRED,
        height
      );
    }
    // then recurse over the goal's children
    renderGoals(
      goal.SubGoals,
      graph,
      node,
      rootGoalWrapper,
      emotionsGlob,
      negativesGlob,
      qualitiesGlob,
      stakeholdersGlob
    );

  };

  /**
   * Recursively renders the goal hierarchy.
   * : goals, the top-level array of goals
   * : graph, the graph into which goals will be rendered
   * : source, the parent goal of the given array, defaults to null
   */
  const renderGoals = (
    goals: ClusterGoal[],
    graph: Graph,
    source: Cell | null = null,
    // rootGoal: Cell | null,
    rootGoalWrapper: { value: Cell | null },
    emotionsGlob: GlobObject,
    negativesGlob: GlobObject,
    qualitiesGlob: GlobObject,
    stakeholdersGlob: GlobObject
  ) => {
    console.log("Logging: renderGoals() called on list: ", goals);
    // accumulate non-functional goals to be rendered into a single symbol
    const emotions = [];
    const qualities = [];
    const concerns = [];
    const stakeholders = [];

    // run through each goal in the given array
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      const type = goal.GoalType;
      const content = goal.GoalContent;
      // recurse over functional goals
      console.log("Render goals type:", type);
      if (type === FUNCTIONAL_TYPE) {
        renderFunction(
          goal,
          graph,
          source,
          rootGoalWrapper,
          emotionsGlob,
          negativesGlob,
          qualitiesGlob,
          stakeholdersGlob
        );

        // accumulate non-functional descriptions into buckets
      } else if (type === EMOTIONAL_TYPE) {
        emotions.push(content);
      } else if (type === NEGATIVE_TYPE) {
        concerns.push(content);
      } else if (type === QUALITY_TYPE) {
        qualities.push(content);
      } else if (type === STAKEHOLDER_TYPE) {
        stakeholders.push(content);
      } else {
        console.log("Logging: goal of unknown type received: " + type);
      }
    }

    // render each of the non-functional goals
    const key = source ? source.value : ROOT_KEY;

    if (emotions.length) {
      emotionsGlob[key] = emotions;
    }
    if (qualities.length) {
      qualitiesGlob[key] = qualities;
    }
    if (concerns.length) {
      negativesGlob[key] = concerns;
    }
    if (stakeholders.length) {
      stakeholdersGlob[key] = stakeholders;
    }
  };

  /**
   * Renders a non-functional goal. No need to recurse here since
   * non-functional goals have no children.
   * : descriptions, the names of the non-functional goals to be
   *      rendered into a single symbol (array of strings)
   * : graph, the graph that the goal will be rendered into
   * : source, the functional goal that the goal will be associated to
   * : type, the type of the non-functional goal (string), this is included
   *      because we need it to know which symbol we are going to render the
   *      goal into
   */
  const renderNonFunction = (
    descriptions: string[],
    graph: Graph,
    source: Cell | null = null,
    type: string = "None"
  ) => {
    
    console.log("Rendering non-functional goal: ", descriptions);
  
    // Fetch parent coordinates
    if (source) {
      const geo = source.getGeometry();
      let x = 0;
      let y = 0;
      if (geo) {
        const sourceX = geo.x;
        const sourceY = geo.y;
        const fWidth = geo.width;
        const fHeight = geo.height;
        let width = fWidth;
        let height = fHeight;
        let delimiter = "";
        let image = "";
  
        switch (type) {
          case EMOTIONAL_TYPE: // Top Right (TR)
            image = HEART_PATH;
            width = fWidth * SW_EMOTIONAL;
            height = fHeight * SH_EMOTIONAL;
            x = sourceX + fWidth * 1.3 - width / 2; // Move to the right
            y = sourceY - fHeight / 4 - height / 2 ; // Move up
            delimiter = ",\n";
            break;
  
          case NEGATIVE_TYPE: // Bottom Right (BR)
            image = NEGATIVE_PATH;
            width = fWidth * SW_NEGATIVE;
            height = fHeight * SH_NEGATIVE;
            x = sourceX + fWidth * 1.3 - width / 2; // Move to the right
            y = sourceY + fHeight * 0.9 - height / 2; // Move down
            delimiter = ",\n";
            break;
  
          case QUALITY_TYPE: // Top Left (TL)
            image = CLOUD_PATH;
            width = fWidth * SW_QUALITY;
            height = fHeight * SH_QUALITY;
            x = sourceX - fWidth / 4 - width / 2 ; // Move to the left
            y = sourceY - fHeight / 4 - height / 2 ; // Move up
            delimiter = ",\n";
            break;
  
          case STAKEHOLDER_TYPE: // Bottom Left (BL)
            image = PERSON_PATH;
            width = fWidth * SW_STAKEHOLDER;
            height = fHeight * SH_STAKEHOLDER;
            x = sourceX - fWidth / 2 - width / 2; // Move to the left
            y = sourceY + fHeight * 0.9 - height / 2; // Move down
            delimiter = "\n";
            break;
        }
  
        // customize vertex style to center text
        let style: CellStateStyle = {
          fontSize: VERTEX_FONT_SIZE,
          fontColor: "black",
          shape: "image",
          image: image,
          align: "center",           // Center horizontally
          verticalAlign: "middle",   // Center vertically
          labelPosition: "center",
          spacingTop: -10,
        };
  
        // If stakeholder, text goes at bottom
        if (type === STAKEHOLDER_TYPE) {
          style = {
            ...style,
            verticalAlign: "top",
            verticalLabelPosition: "bottom",
          };
        }
  
        // Insert the vertex
        const node = graph.insertVertex(
          null,
          null,
          descriptions.join(delimiter),
          x,
          y,
          width,
          height,
          style
        );
  
        const edge = graph.insertEdge(null, null, "", source, node);
        edge.visible = false; // Make the edge invisible - used in auto layout
      }
    }
  };

  /**
   * Render Legend for the graph at the top right corner
   */
  const renderLegend = (graph: Graph): Cell => {
    const legendItems: string[] = [
      STAKEHOLDER_TYPE,
      FUNCTIONAL_TYPE,
      QUALITY_TYPE,
      EMOTIONAL_TYPE,
      NEGATIVE_TYPE,
    ];
    const fWidth = SYMBOL_WIDTH * 0.4;
    const fHeight = SYMBOL_HEIGHT * 0.4;
    const startX = -graph.view.translate.x + graph.view.graphBounds.width + 30;
    const startY = -graph.view.translate.y;

    const legend = graph.insertVertex(
      null,
      null,
      null,
      startX,
      startY,
      fWidth * 1.5,
      fHeight * legendItems.length * 1.5,
      { shape: "rect", strokeColor: "black", fillColor: "transparent" }
    );

    legendItems.forEach((type, index) => {
      let desc;
      let image;
      const width = fWidth;
      const height = fHeight;

      switch (type) {
        case FUNCTIONAL_TYPE:
          desc = "Do";
          image = PARALLELOGRAM_PATH;
          break;
        case EMOTIONAL_TYPE:
          desc = "Feel";
          image = HEART_PATH;
          break;
        case NEGATIVE_TYPE:
          desc = "Concern";
          image = NEGATIVE_PATH;
          break;
        case QUALITY_TYPE:
          desc = "Be";
          image = CLOUD_PATH;
          break;
        case STAKEHOLDER_TYPE:
          desc = "Who";
          image = PERSON_PATH;
          break;
      }

      graph.insertVertex(
        legend,
        null,
        desc,
        fWidth * 0.25,
        fHeight * 1.5 * index,
        width,
        height,
        {
          fontSize: VERTEX_FONT_SIZE,
          fontColor: "black",
          shape: "image",
          image: image,
          verticalAlign: "top",
          verticalLabelPosition: "bottom",
        }
      );
    });
    
    return legend;
  };

  /**
   * Automatically lays-out the functional hierarchy of the graph.
   */
  const layoutFunctions = (graph: Graph, rootGoal: Cell | null) => {
    const layout = new GoalModelLayout(
      graph,
      VERTICAL_SPACING,
      HORIZONTAL_SPACING
    );
    layout.execute(graph.getDefaultParent(), rootGoal as unknown as Cell);
  };

  /**
   * Adds non-functional goals into the hierarchy next to their associated
   * functional goals.
   */
  const associateNonFunctions = (
    graph: Graph,
    rootGoal: Cell | null,
    emotionsGlob: GlobObject,
    negativesGlob: GlobObject,
    qualitiesGlob: GlobObject,
    stakeholdersGlob: GlobObject
  ) => {
    // fetch all the functional goals
    const goals = graph.getChildVertices();

    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      const value = goal.value;

      // render all emotions
      if (emotionsGlob[value]) {
        renderNonFunction(
          emotionsGlob[goal.value],
          graph,
          goal,
          EMOTIONAL_TYPE
        );
      }

      // render all qualities
      if (qualitiesGlob[value]) {
        renderNonFunction(
          qualitiesGlob[goal.value],
          graph, 
          goal, 
          QUALITY_TYPE
        );
      }

      // render all concerns
      if (negativesGlob[value]) {
        renderNonFunction(
          negativesGlob[goal.value],
          graph,
          goal,
          NEGATIVE_TYPE
        );
      }

      // render all stakeholders
      if (stakeholdersGlob[value]) {
        renderNonFunction(
          stakeholdersGlob[goal.value],
          graph,
          goal,
          STAKEHOLDER_TYPE
        );
      }
    }

    // render each of the non-functional goals at the root level
    if (emotionsGlob[ROOT_KEY] && rootGoal != null) {
      renderNonFunction(
        emotionsGlob[ROOT_KEY],
        graph,
        rootGoal,
        EMOTIONAL_TYPE
      );
    }
    if (qualitiesGlob[ROOT_KEY] && rootGoal != null) {
      renderNonFunction(
        qualitiesGlob[ROOT_KEY], 
        graph, 
        rootGoal, 
        QUALITY_TYPE
      );
    }
    if (negativesGlob[ROOT_KEY] && rootGoal != null) {
      renderNonFunction(
        negativesGlob[ROOT_KEY],
        graph,
        rootGoal,
        NEGATIVE_TYPE
      );
    }
    if (stakeholdersGlob[ROOT_KEY] && rootGoal != null) {
      renderNonFunction(
        stakeholdersGlob[ROOT_KEY],
        graph,
        rootGoal,
        STAKEHOLDER_TYPE
      );
    }
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
    recentreView();
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
    recentreView();
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
      } else {
        renderExampleGraph();
      }
    }
  }, [cluster, graph, renderExampleGraph]);

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
