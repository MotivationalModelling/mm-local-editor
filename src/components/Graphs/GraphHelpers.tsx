import {
    Graph,
    Rectangle,
    Cell,
    cellArrayUtils,
  } from "@maxgraph/core";
import { ClusterGoal, GlobObject } from "../types.ts";
import {GoalModelLayout} from "./GoalModelLayout";


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

// preferred vertical and horizontal spacing between functional goals; note
//   the autolayout won't always accomodate these - it will depend on the
//   topology of the model you are trying to render
const VERTICAL_SPACING = 80;
const HORIZONTAL_SPACING = 100;

// Offset from functional goal with associated non-functional goal
const OFFSET_X = 20;
const OFFSET_Y = 20;

// Define shape type
const FUNCTIONAL_TYPE = "Functional";
const EMOTIONAL_TYPE = "Emotional";
const NEGATIVE_TYPE = "Negative";
const QUALITY_TYPE = "Quality";
const STAKEHOLDER_TYPE = "Stakeholder";


// random string, used to store unassociated non-functions in accumulators
const ROOT_KEY = "0723y450nv3-2r8mchwouebfioasedfiadfg";

/**
   * Recursively renders the goal hierarchy.
   * : goals, the top-level array of goals
   * : graph, the graph into which goals will be rendered
   * : source, the parent goal of the given array, defaults to null
   */
export const renderGoals = (
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

  const rootKey = rootGoalWrapper.value;
  console.log("in renderGoal: ", rootGoalWrapper.value, rootKey);

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

  // Determine the key to use for non-functional goals
  let key = source ? source.value : ROOT_KEY;

  // If rootGoalWrapper.value exists and source is null, use its value as the key
  if (!source && rootGoalWrapper.value) {
    key = rootGoalWrapper.value.value;
  }

  // Store non-functional goals using the determined key
  if (emotions.length) {
    if (emotionsGlob[key]) {
      emotionsGlob[key] = emotionsGlob[key].concat(emotions);
    } else {
      emotionsGlob[key] = emotions;
    }
  }
  if (qualities.length) {
    if (qualitiesGlob[key]) {
      qualitiesGlob[key] = qualitiesGlob[key].concat(qualities);
    } else {
      qualitiesGlob[key] = qualities;
    }
  }
  if (concerns.length) {
    if (negativesGlob[key]) {
      negativesGlob[key] = negativesGlob[key].concat(concerns);
    } else {
      negativesGlob[key] = concerns;
    }
  }
  if (stakeholders.length) {
    if (stakeholdersGlob[key]) {
      stakeholdersGlob[key] = stakeholdersGlob[key].concat(stakeholders);
    } else {
      stakeholdersGlob[key] = stakeholders;
    }
  }
};

/**
* Renders a functional goal. The most important thing that this
* does is call renderGoals() over each of the goals children.
* : goal, the goal to be rendered (a Goal JSON object)
* : graph, the graph to render the goal into
* : source, the parent of the goal
*/
export const renderFunction = (
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
 
 // Dynamically set size, based on source (parent) size
 let width = SYMBOL_WIDTH;
 let height = SYMBOL_HEIGHT;
 if (source) {
   const geo = source.getGeometry();
   if (geo) {
     width = geo.width * CHILD_SIZE_SCALE;
     height = geo.height * CHILD_SIZE_SCALE;
   }
 }

 // Get default style from the stylesheet
 const style = graph.getStylesheet().getDefaultVertexStyle();
 // Make sure to specify what image we're drawing
 style.image = PARALLELOGRAM_PATH;

 // insert new vertex and edge into graph
 const node = graph.insertVertex(
   null,
   null,
   arr.join("\n"),
   SYMBOL_X_COORD,
   SYMBOL_Y_COORD,
   width,
   height,
   style
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


// Helper function to check if two rectangles intersect
const doRectanglesIntersect = (rect1: Rectangle, rect2: Rectangle) => {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
};

// Adjust vertical positions to avoid overlap among non-functional goals of the same parent
const adjustVerticalPositions = (node: Cell, siblingNodes: Cell[], graph: Graph) => {
  if (!node || !siblingNodes.length) return;

  const nodeGeo = node.getGeometry();
  if (!nodeGeo) return;

  console.log("adjusting vertical position, ", node, siblingNodes);
  let adjusted = false;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops
  const adjustmentStep = 10;

  // Create a bounding box for the current node
  const nodeBox = new Rectangle(nodeGeo.x, nodeGeo.y, nodeGeo.width, nodeGeo.height);

  // Check for overlaps and adjust positions
  do {
    adjusted = false;
    for (const sibling of siblingNodes) {
      if (node === sibling) continue; // Skip itself

      const siblingGeo = sibling.getGeometry();
      if (!siblingGeo) continue;

      const siblingBox = new Rectangle(siblingGeo.x, siblingGeo.y, siblingGeo.width, siblingGeo.height);

      if (doRectanglesIntersect(nodeBox, siblingBox)) {
        // Move the node upwards
        nodeGeo.y -= adjustmentStep;
        adjusted = true;
        nodeBox.y = nodeGeo.y;
      }
    }
    iterations++;
  } while (adjusted && iterations < maxIterations);

  // Apply updated geometry
  graph.getDataModel().setGeometry(node, nodeGeo);
};

// Adjust horizontal positions to avoid overlap between non-functional and parent functional goals
const adjustHorizontalPositions = (node: Cell, source: Cell, graph: Graph) => {
  if (!node || !source) return;

  const nodeGeo = node.getGeometry();
  const sourceGeo = source.getGeometry();
  if (!nodeGeo || !sourceGeo) return;

  console.log("Adjusting horizontal position:", node, source);
  let adjusted = false;
  let iterations = 0;
  const maxIterations = 100;
  const adjustmentStep = 10; 

  // Create a bounding box for the current node
  const nodeBox = new Rectangle(nodeGeo.x, nodeGeo.y, nodeGeo.width, nodeGeo.height);
  const sourceBox = new Rectangle(sourceGeo.x, sourceGeo.y, sourceGeo.width, sourceGeo.height);

  // Check for overlap with the parent functional goal
  do {
    adjusted = false;
    if (doRectanglesIntersect(nodeBox, sourceBox)) {
      // Determine the direction to move the node to avoid overlap
      if (nodeBox.x < sourceBox.x) {
        nodeGeo.x = sourceBox.x - nodeBox.width - adjustmentStep; // Move left
      } 
      else {
        nodeGeo.x = sourceBox.x + sourceBox.width + adjustmentStep; // Move right
      }

      adjusted = true;
      nodeBox.x = nodeGeo.x;
    }

    iterations++;
  } while (adjusted && iterations < maxIterations);

  // Apply updated geometry
  graph.getDataModel().setGeometry(node, nodeGeo);
};


// Render a non-functional goal (like emotional, quality, etc.)
export const renderNonFunction = (
  descriptions: string[],
  graph: Graph,
  source: Cell | null = null,
  type: string = "None"
) => {

  console.log("Rendering non-functional goal: ", descriptions);

  if (!source) return;

  const geo = source.getGeometry();
  if (!geo) return;

  // Initial coordinates and dimensions
  let x = 0;
  let y = 0;
  let width = geo.width;
  let height = geo.height;
  let delimiter = "";
  let image = "";

  // Set the position and size based on the type of non-functional goal
  switch (type) {
    case EMOTIONAL_TYPE: // Top Right
      image = HEART_PATH;
      width *= SW_EMOTIONAL;
      height *= SH_EMOTIONAL;
      x = geo.x + width + OFFSET_X;
      y = geo.y - height - OFFSET_Y ;
      delimiter = ",\n";
      break;
    case NEGATIVE_TYPE: // Bottom Right
      image = NEGATIVE_PATH;
      width *= SW_NEGATIVE;
      height *= SH_NEGATIVE;
      x = geo.x + width + OFFSET_X;
      y = geo.y + OFFSET_Y;
      delimiter = ",\n";
      break;
    case QUALITY_TYPE: // Top Left
      image = CLOUD_PATH;
      width *= SW_QUALITY;
      height *= SH_QUALITY;
      x = geo.x - width - OFFSET_X;
      y = geo.y - height - OFFSET_Y;
      delimiter = ",\n";
      break;
    case STAKEHOLDER_TYPE: // Bottom Left
      image = PERSON_PATH;
      width *= SW_STAKEHOLDER;
      height *= SH_STAKEHOLDER;
      x = geo.x - width - OFFSET_X;
      y = geo.y + OFFSET_Y;
      delimiter = "\n";
      break;
  }

  // Clone style to avoid modifying the default
  const style = { ...graph.getStylesheet().getDefaultVertexStyle() };
  style.image = image;
  style.align = "center";
  style.verticalAlign = "middle";
  style.labelPosition = "center";
  style.spacingTop = -10;

  // Text goes at bottom for stakeholder
  if (type === STAKEHOLDER_TYPE) {
    style.verticalAlign = "top";
    style.verticalLabelPosition = "bottom";
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
  // Insert an invisible edge
  const edge = graph.insertEdge(null, null, "", source, node);
  edge.visible = false; // Make the edge invisible - used in auto layout

  // Adjust node geometry based on text size
  const nodeGeo = node.getGeometry();
  const preferred = graph.getPreferredSizeForCell(node); // Get preferred size for width based on text
  if (nodeGeo && preferred) {
    // Adjust height based on the number of lines and font size
    nodeGeo.height = descriptions.length * VERTEX_FONT_SIZE * SH_FONT;
    nodeGeo.width = Math.max(nodeGeo.height, preferred.width * SW_PREFERRED, width);
    nodeGeo.height = Math.max(nodeGeo.height, preferred.height * SH_PREFERRED, height);
  }

  // Note for future: There must be some API that does this
  // Get all vertices connected to the same source node (functional goal)
  const siblingNodes = graph.getChildVertices(graph.getDefaultParent()).filter((sibling) => {
    if (sibling === node) return false; // Skip the current node itself

    // Find edges where the current node is the target
    const edges = graph.getIncomingEdges(sibling, null);
    return edges.some((edge) => edge.source === source);
  })

  //const siblingNodes = source.getConnections();
  console.log("siblings: ", siblingNodes);
  
  adjustHorizontalPositions(node, source, graph);
  adjustVerticalPositions(node, siblingNodes, graph);
};

/**
   * Render Legend for the graph at the top right corner
   */
export const renderLegend = (graph: Graph): Cell => {
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
export const layoutFunctions = (graph: Graph, rootGoal: Cell | null) => {
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
export const associateNonFunctions = (
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
    console.log("Associate: ", i, ", ", value);

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
  }

};
