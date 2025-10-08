import {
    Graph,
    Rectangle,
    Cell,
} from "@maxgraph/core";
import { ClusterGoal, GlobObject } from "../types.ts";
import { GoalModelLayout } from "./GoalModelLayout";

import {
    VERTEX_FONT,
    SYMBOL_WIDTH,
    SYMBOL_HEIGHT,
    SYMBOL_CONFIGS,
    SymbolKey
} from "../utils/GraphConstants.tsx";

import { getSymbolKeyByType,formatGoalTag } from "../utils/GraphUtils";

// ---------------------------------------------------------------------------
// some image path
// const PATH_EDGE_HANDLER_ICON = "img/link.png";

// default x,y coordinates of the root goal in the graph - (functional graph)
const SYMBOL_X_COORD = 0;
const SYMBOL_Y_COORD = 0;

// scale factor for sizing child goals in the functional hierarchy; functional
//   goals at each layer should be slightly smaller than their parents
const CHILD_SIZE_SCALE = 0.9;

// preferred vertical and horizontal spacing between functional goals; note
//   the autolayout won't always accomodate these - it will depend on the
//   topology of the model you are trying to render
const VERTICAL_SPACING = 80;
const HORIZONTAL_SPACING = 100;

// Offset from functional goal with associated non-functional goal
const OFFSET_X = 20;
const OFFSET_Y = 20;

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

    //  the functional goal is the child of the parent goal
    //       the non-functional goal is to describe the parent goal

    // 

    // Goals: all root goal (include functional and functional goal)
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
        const id = goal.GoalID
        const content = goal.GoalContent;
        // recurse over functional goals

        // 1. if no root goal, then mark this as root goal
        // the rest on the same level will be treat as child goal
        console.log("Render goals type:", type);
        if (type === SYMBOL_CONFIGS.FUNCTIONAL.type) {
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
        } else if (type === SYMBOL_CONFIGS.EMOTIONAL.type) {
            emotions.push({ id, content });
        } else if (type === SYMBOL_CONFIGS.NEGATIVE.type) {
            concerns.push({ id, content });
        } else if (type === SYMBOL_CONFIGS.QUALITY.type) {
            qualities.push({ id, content });
        } else if (type === SYMBOL_CONFIGS.STAKEHOLDER.type) {
            stakeholders.push({ id, content });
        } else {
            console.log("Logging: goal of unknown type received: " + type);
        }
    }

    // Determine the key to use for non-functional goals, use cell id as unique id
    let key = source?.id?.toString() || ROOT_KEY;

    // If rootGoalWrapper.value exists and source is null, use its value as the key
    if (!source && rootGoalWrapper.value) {
        key = rootGoalWrapper.value.id?.toString() || ROOT_KEY;
    }
    console.log("Key2: ", key)

    // Store non-functional goals using the determined key
    if (emotions.length) {
        console.log("emotions key value: ", key);
        console.log("emotions length: ", emotions);

        // existing
        if (emotionsGlob[key]) {
            emotionsGlob[key] = emotionsGlob[key].concat(emotions);
        } else {
            emotionsGlob[key] = emotions;
        }
        console.log("emotions glob: ", emotionsGlob);
        console.log("emotions glob key: ", emotionsGlob[key]);
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
    const config = SYMBOL_CONFIGS.FUNCTIONAL;

    const arr = goal.GoalContent.split(" ");

    // Dynamically set size, based on source (parent) size
    let width = SYMBOL_WIDTH;
    let height = SYMBOL_HEIGHT;

    // has parent functional goal
    if (source) {
        const geo = source.getGeometry();
        if (geo) {
            width = geo.width * CHILD_SIZE_SCALE;
            height = geo.height * CHILD_SIZE_SCALE;
        }
    }

    // Get default style from the stylesheet and clone
    // If not cloned, will affect all nodes instead.
    const style = { ...graph.getStylesheet().getDefaultVertexStyle() };

    // Make sure to specify what shape we're drawing
    style.shape = config.shape;

    const goalName = formatGoalTag(goal)
    // insert new vertex and edge into graph
    // between functional goal, should connect with edge, rather than cell hierachy
    // Using null ensures the coordinates (SYMBOL_X_COORD, SYMBOL_Y_COORD) are absolute, 
    // not relative to a parent vertex’s coordinate system.
    // The actual layout/positioning is corrected later in: layoutfunction
    const node = graph.insertVertex(
        null,
        goalName, // Functional-8(goal-id)-1(instance-id)
        arr.join("\n"),
        SYMBOL_X_COORD,
        SYMBOL_Y_COORD,
        width,
        height,
        style
    );
    // console.log("goalId:", goal.GoalID, " nodeId:", node.getId(), " value:", node.value);
    if (source) {
        graph.insertEdge(null, null, "", source, node);
    }
    // if no root goal is registered, then store this as root
    if (rootGoalWrapper.value === null) {
        rootGoalWrapper.value = node;
        console.log("rootgoal registered", rootGoalWrapper.value);
    }


    //resize functional goal base on text length and number of lines
    const node_geo = node.getGeometry();
    const preferred = graph.getPreferredSizeForCell(node); //getPreferredSizeForCell only works for width
    if (node_geo && preferred) {
        node_geo.height = arr.length * VERTEX_FONT.size * VERTEX_FONT.scaleHeight; //get height base on the number of lines in goal text and font size
        node_geo.width = Math.max(
            node_geo.height,
            preferred.width * config.scale.width,
            width
        );
        node_geo.height = Math.max(
            node_geo.height,
            preferred.height * config.scale.height,
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
            } else {
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
    descriptions: Array<{ id: number; content: string }>,
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
    let shape = "";

    // Set the position and size based on the type of non-functional goal
    // Get symbol key and config
    const symbolKey = getSymbolKeyByType(type);

    if (symbolKey) {
        const config = SYMBOL_CONFIGS[symbolKey];
        shape = config.shape;
        width *= config.scale.width;
        height *= config.scale.height;

        // Set the position and delimiter based on symbol type
        switch (symbolKey) {
            case "EMOTIONAL": // Top Right
                x = geo.x + width + OFFSET_X;
                y = geo.y - height - OFFSET_Y;
                delimiter = ", ";
                break;
            case "NEGATIVE": // Bottom Right
                x = geo.x + width + OFFSET_X;
                y = geo.y + OFFSET_Y;
                delimiter = ", ";
                break;
            case "QUALITY": // Top Left
                x = geo.x - width - OFFSET_X;
                y = geo.y - height - OFFSET_Y;
                delimiter = ", ";
                break;
            case "STAKEHOLDER": // Bottom Left
                x = geo.x - width - OFFSET_X;
                y = geo.y + OFFSET_Y;
                delimiter = "\n";
                break;
        }
    } else {
        console.warn(`Unknown type "${type}" — no matching symbol config found.`);
    }

    // Clone style to avoid modifying the default
    const style = { ...graph.getStylesheet().getDefaultVertexStyle() };
    style.shape = shape;
    style.align = "center";
    style.verticalAlign = "middle";
    style.labelPosition = "center";
    style.spacingTop = 0;

    // Text goes at bottom for stakeholder
    if (type === SYMBOL_CONFIGS.STAKEHOLDER.type) {
        style.verticalAlign = "top";
        style.verticalLabelPosition = "bottom";
    } else if (type === SYMBOL_CONFIGS.NEGATIVE.type) {
        style.fillColor = "grey";
    }

    const squareLabel = makeSquareLable(descriptions.map(d => d.content), ", ");

    // Insert the vertex
    const node = graph.insertVertex(
        null,
        "NonFunctional"+descriptions.map(x => x.id).join(delimiter),
        squareLabel,
        x,
        y,
        width,
        height,
        style
    );
    console.log("nonFunctional node: ",node)
    // Insert an invisible edge
    const edge = graph.insertEdge(null, null, "", source, node);
    edge.visible = false; // Make the edge invisible - used in auto layout

    // Adjust node geometry based on text size
    const nodeGeo = node.getGeometry();
    const preferred = graph.getPreferredSizeForCell(node); // Get preferred size for width based on text

    if (nodeGeo && preferred) {
        // Adjust height based on the number of lines and font size
        const lines: string[] = squareLabel.split(/\n/);
        nodeGeo.height = lines.length * VERTEX_FONT.size * VERTEX_FONT.scaleHeight;

        let maxLineWidth = Math.max(...lines.map(l => l.length)) * VERTEX_FONT.size * 0.6;
        // const side = Math.round((nodeGeo.height + maxLineWidth) / 2);

        const ratio = maxLineWidth / nodeGeo.height;
        if (ratio > 1.5) {
            nodeGeo.height = maxLineWidth / 1.5;
        } else if (ratio < 0.67) {
            maxLineWidth = nodeGeo.height * 0.67;
        }
        
        nodeGeo.width = Math.max(maxLineWidth, preferred.width * SYMBOL_CONFIGS.FUNCTIONAL.scale.width, width);
        nodeGeo.height = Math.max(nodeGeo.height, preferred.height * SYMBOL_CONFIGS.FUNCTIONAL.scale.height, height);
    }

    // Note for future: There must be some API that does this
    // Get all vertices connected to the same source node (functional goal)
    const siblingNodes = graph.getChildVertices(graph.getDefaultParent()).filter((sibling) => {
        if (sibling === node) return false; // Skip the current node itself

        // Find edges where the current node is the target
        const edges = graph.getIncomingEdges(sibling, null);
        return edges.some((edge) => edge.source === source);
    });

    //const siblingNodes = source.getConnections();
    console.log("siblings: ", siblingNodes);

    adjustHorizontalPositions(node, source, graph);
    adjustVerticalPositions(node, siblingNodes, graph);
};

/**
   * Render Legend for the graph at the top right corner
   */
export const renderLegend = (graph: Graph): Cell => {
    const legendTypes: SymbolKey[] = [
        "STAKEHOLDER",
        "FUNCTIONAL",
        "QUALITY",
        "EMOTIONAL",
        "NEGATIVE",
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
        fHeight * legendTypes.length * 1.5,
        { shape: "rect", strokeColor: "black", fillColor: "transparent" }
    );

    legendTypes.forEach((symbolKey, index) => {
        const width = fWidth;
        const height = fHeight;

        const config = SYMBOL_CONFIGS[symbolKey];

        graph.insertVertex(
            legend,
            null,
            config.label,
            fWidth * 0.25,
            fHeight * 1.5 * index,
            width,
            height,
            {
                fontSize: VERTEX_FONT.size,
                fontColor: VERTEX_FONT.color,
                shape: "image",
                image: config.imagePath,
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
    console.log("Glob: ", emotionsGlob, negativesGlob, qualitiesGlob, stakeholdersGlob)
    // fetch all the functional goals
    const goals = graph.getChildVertices();

    console.log("Glob;child ", goals)

    goals.forEach((goal, i) => {
        const value = goal.id?.toString();
        if (!value) return;
        console.log("Associate: ", i, ", ", value);

        // render all concerns
        if (negativesGlob[value]) {
            renderNonFunction(
                negativesGlob[value],
                graph,
                goal,
                SYMBOL_CONFIGS.NEGATIVE.type
            );
        }
        // render all stakeholders
        if (stakeholdersGlob[value]) {
            renderNonFunction(
                stakeholdersGlob[value],
                graph,
                goal,
                SYMBOL_CONFIGS.STAKEHOLDER.type
            );
        }

        // render all emotions
        if (emotionsGlob[value]) {
            renderNonFunction(
                emotionsGlob[value],
                graph,
                goal,
                SYMBOL_CONFIGS.EMOTIONAL.type
            );
        }

        // render all qualities
        if (qualitiesGlob[value]) {
            renderNonFunction(
                qualitiesGlob[value],
                graph,
                goal,
                SYMBOL_CONFIGS.QUALITY.type
            );
        }
    });
};

export function makeSquareLable (
    items: Array<string>,
    sep = ", "
  ): string {
    const n = items.length;

    if (n === 0) {
        return "";
    }

    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const lines: string[] = [];

    for (let r = 0; r < rows; r++) {
      const slice = items.slice(r * cols, (r + 1) * cols);
      lines.push(slice.join(sep));
    }

    return lines.join(", \n");
  }

export function isGoalNameEmpty(value: string): boolean {
    return !value || value.trim() === "";
}