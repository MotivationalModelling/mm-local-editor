import {
  CellStyle,
  Client,
  Graph,
  InternalEvent,
  CellStateStyle,
  DragSource,
  Cell,
  ConnectionHandler,
  ImageBox,
  KeyHandler,
  UndoManager,
  EventObject,
  error,
  PanningHandler,
  xmlUtils,
  Codec,
  ModelXmlSerializer,
} from "@maxgraph/core";
import { GoalModelLayout } from "./GoalModelLayout";

import { useRef, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import "./GraphWorker.css";
import {
  registerCustomShapes,
  NEGATIVE_SHAPE,
  PERSON_SHAPE,
  CLOUD_SHAPE,
  PARALLELOGRAM_SHAPE,
  HEART_SHAPE,
} from "./GraphShapes";

import GraphSidebar from "./GraphSidebar";
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
const PATH_EDGE_HANDLER_ICON = "img/link.png";

// default width/height of the root goal in the graph
const SYMBOL_WIDTH = 145;
const SYMBOL_HEIGHT = 110;

// size of the edge-creation icon
const ICON_WIDTH = 14;
const ICON_HEIGHT = 14;

// vertex default font size
const VERTEX_FONT_SIZE = 16;


// default x,y coordinates of the root goal in the graph - (functional graph)
const SYMBOL_X_COORD = 0;
const SYMBOL_Y_COORD = 0;

// scale factor for sizing child goals in the functional hierarchy; functional
//   goals at each layer should be slightly smaller than their parents
const CHILD_SIZE_SCALE = 0.8;

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
const VERTICAL_SPACING = 60;
const HORIZONTAL_SPACING = 60;


// Define shape type
const FUNCTIONAL_TYPE = "Functional";
const EMOTIONAL_TYPE = "Emotional";
const NEGATIVE_TYPE = "Negative";
const QUALITY_TYPE = "Quality";
const STAKEHOLDER_TYPE = "Stakeholder";

// Define shape data
const FUNCTIONAL_DATA = "functionaldata";


// random string, used to store unassociated non-functions in accumulators
const ROOT_KEY = "0723y450nv3-2r8mchwouebfioasedfiadfg";

// ---------------------------------------------------------------------------

interface CellHistory {
  [cellID: string]: [width: number | undefined, height: number | undefined];
}

interface GlobObject {
  [key: string]: string[];
}

// DropHandler from DragSource @maxgraph/core
// type DropHandler = (
//   graph: Graph,
//   evt: MouseEvent,
//   cell: Cell | null,
//   x?: number,
//   y?: number
// ) => void;

// ---------------------------------------------------------------------------

const GraphWorker = () => {
  const divGraph = useRef<HTMLDivElement>(null);
  //   const divSidebar = useRef<HTMLDivElement>(null);
  const [graphRef, setGraphRef] = useState<Graph | null>(null);

  /**
   * Re-centre/Re-scale
   * Function for resetting zoom and recentring the graph
   *  This is necessary when "Export" is pressed to help export the graph to the
   *    right resolution. to properly locate the canvas view for the export
   *    function, we actually need to centre the view such that:
   *      x = x coord of leftmost symbol; and
   *      y = y coord of topmost symbol
   */
  const recentreView = () => {
    const graph = graphRef;
    if (graph) {
      // get the list of all cells in the graph
      const widthCanvas = graph.container.clientWidth;
      const heightCanvas = graph.container.clientHeight;
      const vertices = graph.getChildVertices();

      // if no vertices, then just centre to (0,0)
      if (vertices.length == 0) {
        graph.view.setTranslate(0, 0);
        graph.view.setScale(1);
        return;
      }

      // if there are vertices, then find the leftmost x coord and upmost y coord
      let horizontal = 0;
      let vertical = 0;

      for (let i = 0; i < vertices.length; i++) {
        const curr = vertices[i].geometry;
        if (curr) {
          horizontal += curr?.x;
          vertical += curr?.y;
        }
      }
      const centroid_x = horizontal / vertices.length;
      const centroid_y = vertical / vertices.length;

      // recentres the view to its starting point (x = 0, y = 0)

      graph.view.setTranslate(
        -centroid_x + (widthCanvas - 100) / 2,
        -centroid_y + heightCanvas / 2
      );
    }
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
    rootGoal: Cell | null,
    emotionsGlob: GlobObject,
    negativesGlob: GlobObject,
    qualitiesGlob: GlobObject,
    stakeholdersGlob: GlobObject
  ) => {
    // reset - remove any existing graph if render is called
    graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
    graph.removeCells(graph.getChildEdges(graph.getDefaultParent()));
    rootGoal = null;

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
    goal,
    graph: Graph,
    source: Cell | null = null,
    rootGoal: Cell | null,
    emotionsGlob: GlobObject,
    negativesGlob: GlobObject,
    qualitiesGlob: GlobObject,
    stakeholdersGlob: GlobObject
  ) => {
    console.log("functionalllll");
    console.log(goal.GoalContent);
    const arr = goal.GoalContent.split(" ");
    console.log(arr);
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
    const edge = graph.insertEdge(null, null, "", source, node);

    // if no root goal is registered, then store this as root
    if (rootGoal === null) {
      rootGoal = node;
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
      rootGoal,
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
    rootGoal: Cell | null,
    emotionsGlob: GlobObject,
    negativesGlob: GlobObject,
    qualitiesGlob: GlobObject,
    stakeholdersGlob: GlobObject
  ) => {
    console.log("Logging: renderGoals() called on list: " + goals);

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
      if (type === FUNCTIONAL_DATA) {
        renderFunction(
          goal,
          graph,
          source,
          rootGoal,
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
    console.log("nonfunctionalllll");
    console.log(descriptions);
    // fetch parent coordinates
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
          case EMOTIONAL_TYPE:
            image = HEART_PATH;
            width = fWidth * SW_EMOTIONAL;
            height = fHeight * SH_EMOTIONAL;
            x = sourceX - width / 2 - fWidth / 4;
            y = sourceY - height / 2 - fHeight / 4;
            delimiter = ",\n";
            break;
          case NEGATIVE_TYPE:
            image = NEGATIVE_PATH;
            width = fWidth * SW_NEGATIVE;
            height = fHeight * SH_NEGATIVE;
            x = sourceX + fWidth * 1.15 - width / 2;
            y = sourceY - height / 2 - fHeight / 4;
            delimiter = ",\n";
            break;
          case QUALITY_TYPE:
            image = CLOUD_PATH;
            width = fWidth * SW_QUALITY;
            height = fHeight * SH_QUALITY;
            x = sourceX - width / 2 - fWidth / 4;
            y = sourceY + fHeight * 1.15 - height / 2;
            delimiter = ",\n";
            break;
          case STAKEHOLDER_TYPE:
            image = descriptions.length > 1 ? PERSON_PATH : PERSON_PATH; // Need image for multiple stakholders ???????????
            width = fWidth * SW_STAKEHOLDER;
            height = fHeight * SH_STAKEHOLDER;
            x = sourceX + fWidth * 1.05 - width / 2;
            y = sourceY + fHeight - height / 2;
            delimiter = "\n";
            break;
        }

        // customize vertex style
        let style: CellStateStyle = {
          fontSize: VERTEX_FONT_SIZE,
          fontColor: "black",
          shape: "image",
          image: image,
        };
        // if stakeholder, text goes at bottom
        if (type === STAKEHOLDER_TYPE) {
          style = {
            ...style,
            verticalAlign: "top",
            verticalLabelPosition: "bottom",
          };
        }

        // insert the vertex
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
        // make the edge invisible - we still want to create the edge
        // the edge is needed when running the autolayout logic
        edge.visible = false;
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
        renderNonFunction(qualitiesGlob[goal.value], graph, goal, QUALITY_TYPE);
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
      renderNonFunction(qualitiesGlob[ROOT_KEY], graph, rootGoal, QUALITY_TYPE);
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

  useEffect(() => {  
    //let graph: Graph;
    if (divGraph.current) {
      const graphContainer = divGraph.current
      InternalEvent.disableContextMenu(graphContainer);

      // config: allow drag-panning using left click on empty canvas space
      let graph = new Graph(graphContainer);
      setGraphRef(graph);
      console.log(graph.getDataModel());
      graph.getDataModel().beginUpdate();

      const layout = new GoalModelLayout(
        graph,
        VERTICAL_SPACING,
        HORIZONTAL_SPACING
      );
      layout.execute(graph.getDefaultParent());
      // const layout = new CompactTreeLayout(graph);
      // layout.execute(graph.getDefaultParent());

      graph.setPanning(true); // Use mouse right button for panning
      // set up graph default style of edges and vertices
      setGraphStyle(graph);

      // listen to graph changes and add item to graphs accordingly
      graphListener(graph);

      // Gets the default parent for inserting new cells. This
      // is normally the first child of the root (ie. layer 0).
      // const parent = graph.getDefaultParent();

      // // keep the container focused
      // const graphFireMouseEvent = Graph.prototype.fireMouseEvent;
      // Graph.prototype.fireMouseEvent = (evtName: string, me: InternalMouseEvent, sender?: EventSource) => {
      //     if (evtName === InternalEvent.MOUSE_DOWN){
      //         graph.container.focus();
      //     }
      //     graphFireMouseEvent.apply(this,[evtName, me, sender]);
      // }

      /**
       * Edge Handler
       *
       * This manifests an icon that appears in the middle of a vertex when you
       * hover over it with the mouse; the icon can be used to create edges out
       * of the vertex by click-and-drag.
       */
      const connectionHandler = graph.getPlugin(
        "ConnectionHandler"
      ) as ConnectionHandler;
      connectionHandler.connectImage = new ImageBox(
        PATH_EDGE_HANDLER_ICON,
        ICON_WIDTH,
        ICON_HEIGHT
      );
      // delete and undo action in graph
      supportFunctions(graph);

      /**
       * Autolayout
       *
       * The following functions are used to run generate and autolayout the graph
       * using the goal list provided by the editor.
       */

      // variable, stores the identity of the root function
      let rootGoal: Cell | null = null;

      // maps from function_id -> associated non-functional goals
      //    A bug that arises from this implementation is that if a functional goal
      //    of identical name appears in multiple places in the goal hierarchy, then
      //    every instance of the goal will be rendered with non-functional goals
      //    pertaining to all instances of the functional goal/

      let emotionsGlob: GlobObject = {};
      let negativesGlob: GlobObject = {};
      let qualitiesGlob: GlobObject = {};
      let stakeholdersGlob: GlobObject = {};

      /**
       * Renders window.jsonData into a motivational model into graphContainer.
       */
      const renderGraph = (container: HTMLElement) => {
        // saveJSON(false);
        console.log("Logging: renderGraph() called.");

        resetGraph(
          graph,
          rootGoal,
          emotionsGlob,
          negativesGlob,
          qualitiesGlob,
          stakeholdersGlob
        );

        // check that browser is supported
        if (!Client.isBrowserSupported()) {
          console.log("Logging: browser not supported");
          error("Browser not supported!", 200, false);
          // utils.error("Browser not supported!", 200, false);
          return;
        }

        // disable context menu
        InternalEvent.disableContextMenu(container);
        //--------------------------------this should change to render from xml file --------------------------
        // grab the clusters from window.jsonData
        if (window.jsonData) {
          const clusters = window.jsonData.GoalModelProject.Clusters as Cluster[];

          // render the graph
          graph.getDataModel().beginUpdate(); // start transaction
          for (let i = 0; i < clusters.length; i++) {
            // grab goal hierarchy from the cluster
            const goals = clusters[i].ClusterGoals;
            // ... then call render
            renderGoals(
              goals,
              graph,
              null,
              rootGoal,
              emotionsGlob,
              negativesGlob,
              qualitiesGlob,
              stakeholdersGlob
            );
          }
          layoutFunctions(graph, rootGoal);
          associateNonFunctions(
            graph,
            rootGoal,
            emotionsGlob,
            negativesGlob,
            qualitiesGlob,
            stakeholdersGlob
          );
          graph.getDataModel().endUpdate(); // end transaction
        }
      };

      graph.getDataModel().endUpdate();
    }

    registerCustomShapes();
    const graph = graphRef;
    if (!graph) return;
    const parent = graph.getDefaultParent();
    graph.batchUpdate(() => {
      console.log("graphing batch update");
      const vertex1 = graph.insertVertex(
        parent,
        null,
        "person shape",
        100,
        40,
        SYMBOL_WIDTH,
        SYMBOL_HEIGHT,
        { shape: PARALLELOGRAM_SHAPE, fontColor: "blue" }
      );
      const vertex2 = graph.insertVertex(
        parent,
        null,
        "parallelogram shape",   
        500,
        100,
        SYMBOL_WIDTH,
        SYMBOL_HEIGHT,
        { shape: CLOUD_SHAPE, fontColor: "black" }
      );
      graph.insertEdge(parent, null, "", vertex1, vertex2);

      const vertex3 = graph.insertVertex(
        parent,
        null,
        "heart shape",
        20,
        200,
        SYMBOL_WIDTH,
        SYMBOL_HEIGHT,
        { shape: NEGATIVE_SHAPE, fillColor: "grey", fontColor: "black" }
      );
      const vertex4 = graph.insertVertex(
        parent,
        null,
        "negative shape",
        150,
        350,
        SYMBOL_WIDTH,
        SYMBOL_HEIGHT,
        { shape: PERSON_SHAPE, fontColor: "black" }
      );
      graph.insertEdge(parent, null, "", vertex3, vertex4);

      const vertex5 = graph.insertVertex(
        parent,
        null,
        "heart shape",
        200,
        200,
        SYMBOL_WIDTH,
        SYMBOL_HEIGHT,
        { shape: HEART_SHAPE, fontColor: "black" }
      );
      const vertex6 = graph.insertVertex(
        parent,
        null,
        "cloud shape",
        350,
        350,
        SYMBOL_WIDTH,
        SYMBOL_HEIGHT,
        { shape: CLOUD_SHAPE, fontColor: "black" }
      );
      graph.insertEdge(parent, null, "", vertex5, vertex6);
    });
    // }

    return () => {
      graph.destroy();
    };
  }, [divGraph.current]);

  // --------------------------------------------------------------------------------------------------------------------------------------------------
  // graphXML content(should have a way to separate codes into another file)

  interface Secret {
    token: string;
    uid: string;
    uuid?: string;
  }

  interface ExportResponse {
    png: {
      data: number[];
    };
    version: string;
  }

  interface Navigator {
    msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
  }

  /* const exportModel = () => {
    recentreView();

    const payload = Cookies.get("LOKIDIED") ?? '{token: "", uid: "", uiid: ""}';
    const SECRET: Secret = JSON.parse(payload);
    const FILENAME = "MM_image";

    const token = SECRET.token;
    const userId = SECRET.uid;

    const modelId = Cookies.get("CMID");
    const exportURL = `/goal_model/exportToPng/${userId}/${modelId}`;

    const svg = document.getElementsByTagName("svg")[0];
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    const style = svg.getAttribute("style")?.split(";") ?? [];
    const width = style[3]?.split(":")[1];
    const height = style[4]?.split(":")[1];

    if (width && height) {
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
    }

    const serializer = new XMLSerializer();
    const ser = serializer.serializeToString(svg);

    axios
      .post<ExportResponse>(
        exportURL,
        { svg: ser },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "json",
        }
      )
      .then((response) => {
        const res = response.data;
        console.log(res.png.data);
        const data = new Uint8Array(res.png.data);
        const pngFile = new Blob([data], { type: "image/png" });

        const navigator = window.navigator as Navigator;
        if (navigator.msSaveOrOpenBlob) {
          // IE10+
          navigator.msSaveOrOpenBlob(pngFile, FILENAME);
        } else {
          const a = document.createElement("a"),
            url = URL.createObjectURL(pngFile);
          a.href = url;
          a.download = res.version + ".png";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
        }
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };
 */

  /**
   * send XML to backend
   * @param isTemplate
   */
  /* const sendXML = (isTemplate: boolean) => {
    const graph = graphRef;
    if (!graph) return;

    const payload = Cookies.get("LOKIDIED") ?? '{token: "", uid: "", uiid: ""}';

    const SECRET: Secret = JSON.parse(payload);

    const token = SECRET.token;
    const userId = SECRET.uid;

    const modelId = Cookies.get("CMID");
    let url = `/goal_model/xml/${userId}/${modelId}`;

    if (isTemplate) {
      const templateId = Cookies.get("TID");
      url = `/template/${userId}/${templateId}`;
    }

    recentreView();

    const xml = parseToXML(graph);
    const svg = graph.container.firstElementChild as SVGSVGElement;

    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    const style = svg.getAttribute("style")?.split(";") ?? [];
    const width = style[3]?.split(":")[1];
    const height = style[4]?.split(":")[1];

    if (width && height) {
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
    }

    const serializer = new XMLSerializer();
    const ser = serializer.serializeToString(svg);

    axios
      .put(
        url,
        { xml: xml, svg: ser },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "json",
        }
      )
      .then(() => {
        // handle success
      })
      .catch((error) => {
        // handle error
      });
  };
 */
  /**
   * get XML from backend
   */
  /* const getXML = () => {
    const payload = Cookies.get("LOKIDIED") ?? '{token: "", uid: "", uiid: ""}';

    const SECRET = JSON.parse(payload);

    const token = SECRET.token;
    const userId = SECRET.uid;

    const modelId = Cookies.get("CMID");
    const url = `/goal_model/xml/${userId}/${modelId}`;

    // the API of upload pictures
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        // handle success
      })
      .catch(() => {
        // handle error
      });
  };
 */
  /**
   * Parses the graph to XML, to be saved/loaded in a differenct session.
   */
  const parseToXML = (graph: Graph) => {
    const encoder = new Codec();
    const node = encoder.encode(graph.getDataModel());
    const xml = xmlUtils.getPrettyXml(node);
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
    <Container>
      <Row className="row">
        <Col md={11}>
          <div id={GRAPH_DIV_ID} ref={divGraph} />
        </Col>
        <Col md={1}>
          <GraphSidebar graph={graphRef} recentreView={recentreView} />
        </Col>
      </Row>
    </Container>
  );
};

// ---------------------------------------------------------------------------

export default GraphWorker;
