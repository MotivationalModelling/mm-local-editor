import React, { MutableRefObject, useEffect, useRef } from "react";
import {
  Graph,
  MaxToolbar,
  DomHelpers,
  Cell,
  CellStateStyle,
  Geometry,
  Point,
  gestureUtils,
} from "@maxgraph/core";
import {
  NEGATIVE_SHAPE,
  PERSON_SHAPE,
  CLOUD_SHAPE,
  PARALLELOGRAM_SHAPE,
  HEART_SHAPE,
} from "./GraphShapes";

// paths to the image
const HEART_PATH = "src/assets/img/Heart.png";
const PARALLELOGRAM_PATH = "src/assets/img/Function.png";
const NEGATIVE_PATH = "src/assets/img/Risk.png";
const CLOUD_PATH = "src/assets/img/Cloud.png";
const PERSON_PATH = "src/assets/img/Stakeholder.png";

// Define shape type
const FUNCTIONAL_TYPE = "Functional";
const EMOTIONAL_TYPE = "Emotional";
const NEGATIVE_TYPE = "Negative";
const QUALITY_TYPE = "Quality";
const STAKEHOLDER_TYPE = "Stakeholder";

// Define shape data
const FUNCTIONAL_DATA = "functionaldata";
const EMOTIONAL_DATA = "emotionaldata";
const NEGATIVE_DATA = "negativedata";
const QUALITY_DATA = "qualitydata";
const STAKEHOLDER_DATA = "stakeholderdata";

// some image path
const ZOOMIN_PATH = "src/assets/img/zoomin.svg";
const ZOOMOUT_PATH = "src/assets/img/zoomout.svg";
const CENTRE_PATH = "src/assets/img/centre.svg";
const LINE_PATH = "src/assets/img/line.svg";

const SIDEBAR_DIV_ID = "sidebarContainer";

// vertex default font size
const VERTEX_FONT_SIZE = 16;
// vertex default font colour
const VERTEX_FONT_COLOUR = "black";

const LINE_SIZE = 50;

// default width/height of the root goal in the graph
const SYMBOL_WIDTH = 145;
const SYMBOL_HEIGHT = 110;

// scale factors for non-functional goals; these scale factors are relative
//   to the size of the associated functional goal
const SW_FUNCTIONAL = 1.045;
const SH_FUNCTIONAL = 0.8;
const SW_EMOTIONAL = 0.9;
const SH_EMOTIONAL = 0.96;
const SW_QUALITY = 1;
const SH_QUALITY = 0.8;
const SW_NEGATIVE = 0.9;
const SH_NEGATIVE = 0.96;
const SW_STAKEHOLDER = 1;
const SH_STAKEHOLDER = 1.2;

// Colour set
const COLOUR_SET = [
  "#d54417",
  "#edd954",
  "#1a9850",
  "#e68f35",
  "#daf266",
  "#acc93f",
  "#ffffff",
];

type recentreViewFunction = () => void;

// DropHandler from DragSource @maxgraph/core
type DropHandler = (
  graph: Graph,
  evt: MouseEvent,
  cell: Cell | null,
  x?: number,
  y?: number
) => void;

type GraphSidebarProps = {
  graph: Graph | null;
  recentreView: recentreViewFunction;
};

const GraphSidebar = ({ graph, recentreView }: GraphSidebarProps) => {
  const divSidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("sidebar");

    let sidebar: MaxToolbar;
    const sidebarContainer: HTMLElement | undefined =
      divSidebar.current || undefined;

    // const sidebarElement = document.getElementById("sidebarContainer")
    if (sidebarContainer && graph) {
      console.log("Establish sidebar container");
      console.log(graph);

      // Add colour selection section to sidebar
      if (divSidebar.current) {
        const label = document.createElement("label");
        label.innerHTML = "Select Colour:";
        label.htmlFor = "choose_colours";

        divSidebar.current.appendChild(label);

        // Apply the color changing function
        const addButton = (colour: string) => {
          const btn = DomHelpers.button("", () => {
            graph.getDataModel().beginUpdate();
            try {
              const cells = graph.getSelectionCells();
              for (let i = 0; i < cells.length; i++) {
                const style = graph.getCellStyle(cells[i]);
                style.fillColor = colour;
                graph.getDataModel().setStyle(cells[i], style);
              }
            } finally {
              graph.getDataModel().endUpdate();
            }
          });

          btn.className = "ColorButton";
          btn.style.width = "60px";
          btn.style.height = "20px";
          btn.style.backgroundColor = colour;
          btn.style.border = "2px";

          switch (colour) {
            case "#d54417":
              btn.ariaLabel = "HIGH";
              btn.innerHTML = "HIGH";
              btn.style.fontSize = "10px";
              break;
            case "#edd954":
              btn.ariaLabel = "MEDIUM";
              btn.innerHTML = "MEDIUM";
              btn.style.fontSize = "10px";
              break;
            case "#1a9850":
              btn.ariaLabel = "LOW";
              btn.innerHTML = "LOW";
              btn.style.fontSize = "10px";
              break;
          }
          divSidebar.current.appendChild(btn);
        };

        for (let i = 0; i < COLOUR_SET.length; i++) {
          addButton(COLOUR_SET[i]);
        }

        // create the sidebar in the specified container
        sidebar = new MaxToolbar(sidebarContainer);
        sidebar.enabled = false; // turn off 'activated' aesthetic
        // zoom-in and zoom-out buttons
        sidebar.addLine(); // purely aesthetic
        const zoomIn = sidebar.addItem("Zoom In", ZOOMIN_PATH, () => {
          graph.zoomIn();
        });
        zoomIn.style.width = "20px"; // set width of the zoom icon

        // centring graph button (svg not found)
        const centre = sidebar.addItem("centre", CENTRE_PATH, () => {
          recentreView();
        });
        centre.style.width = "20px";

        const zoomOut = sidebar.addItem("Zoom Out", ZOOMOUT_PATH, () => {
          graph.zoomOut();
        });
        zoomOut.style.width = "20px";
        sidebar.addLine();

        // add the sidebar elements for each of the goals
        const addSidebarItem = (
          graph: Graph,
          sidebar: MaxToolbar,
          imagePath: string,
          width: number,
          height: number,
          isEdge: boolean
        ) => {
          let type = "";
          let goalID: string | null;
          let data = "";
          let prototype: Cell;
          // create the prototype cell which will be cloned when a sidebar item
          // is dragged on to the graph
          if (!isEdge) {
            let shape = "";
            switch (imagePath) {
              case PARALLELOGRAM_PATH:
                shape = PARALLELOGRAM_SHAPE;
                type = FUNCTIONAL_TYPE;
                data = FUNCTIONAL_DATA;
                break;
              case HEART_PATH:
                shape = HEART_SHAPE;
                type = EMOTIONAL_TYPE;
                data = EMOTIONAL_DATA;
                break;
              case NEGATIVE_PATH:
                shape = NEGATIVE_SHAPE;
                type = NEGATIVE_TYPE;
                data = NEGATIVE_DATA;
                break;
              case CLOUD_PATH:
                shape = CLOUD_SHAPE;
                type = QUALITY_TYPE;
                data = QUALITY_DATA;
                break;
              case PERSON_PATH:
                shape = PERSON_SHAPE;
                type = STAKEHOLDER_TYPE;
                data = STAKEHOLDER_DATA;
                break;
            }

            let shapeStyle: CellStateStyle = {
              fontSize: VERTEX_FONT_SIZE,
              fontColor: VERTEX_FONT_COLOUR,
              shape: shape,
            };
            graph.getStylesheet().putCellStyle("minWidth", shapeStyle);
            graph.getStylesheet().putCellStyle("minHeight", shapeStyle);

            if (imagePath == PERSON_PATH) {
              shapeStyle = {
                ...shapeStyle,
                verticalAlign: "top",
                verticalLabelPosition: "bottom",
                autoSize: false,
              };
            } else if (imagePath == NEGATIVE_PATH) {
              shapeStyle = { ...shapeStyle, fillColor: "grey" };
            }
            prototype = new Cell(
              null,
              new Geometry(0, 0, width, height),
              shapeStyle
            );
            prototype.setVertex(true);
          } else {
            prototype = new Cell(null, new Geometry(0, 0, width, height));
            if (prototype.geometry) {
              prototype.geometry.relative = true;
              prototype.setEdge(true);
            }
          }

          const dragAndDrop: DropHandler = (
            graph: Graph,
            evt: MouseEvent,
            cell: Cell | null,
            x?: number,
            y?: number
          ): void => {
            graph.stopEditing(false);
            const point = graph.getPointForEvent(evt);
            const goal = graph.getDataModel().cloneCell(prototype);

            if (goal && goal.geometry) {
              goal.geometry.x = point.x;
              goal.geometry.y = point.y;
              graph.importCells([goal], 0, 0, cell);
            }
          };

          const dragAndDropEdge: DropHandler = (
            graph: Graph,
            evt: MouseEvent,
            cell: Cell | null,
            x?: number,
            y?: number
          ) => {
            graph.stopEditing(false);
            const point = graph.getPointForEvent(evt);
            const goal = graph.getDataModel().cloneCell(prototype);

            if (goal && goal.geometry) {
              goal.geometry.setTerminalPoint(new Point(point.x, point.y), true);
              goal.geometry.setTerminalPoint(
                new Point(point.x + LINE_SIZE, point.y + LINE_SIZE),
                false
              );
              goal.parent = graph.getDefaultParent();
              graph.importCells([goal], 0, 0, cell);
            }
          };
          // add a symbol to the sidebar
          const sidebarItem = sidebar.addMode(
            null,
            imagePath,
            dragAndDrop,
            imagePath
          );
          sidebarItem.style.width = "60px";
          if (imagePath == PERSON_PATH) {
            sidebarItem.style.width = "30px";
          }
          if (!isEdge) {
            gestureUtils.makeDraggable(sidebarItem, graph, dragAndDrop);
          } else {
            gestureUtils.makeDraggable(sidebarItem, graph, dragAndDropEdge);
            sidebarItem.style.width = "50px";
          }
        };

        // add sidebar items for each of the goal types
        addSidebarItem(
          graph,
          sidebar,
          PERSON_PATH,
          SYMBOL_WIDTH * SW_STAKEHOLDER,
          SYMBOL_HEIGHT * SH_STAKEHOLDER,
          false
        );
        addSidebarItem(
          graph,
          sidebar,
          PARALLELOGRAM_PATH,
          SYMBOL_WIDTH * SW_FUNCTIONAL,
          SYMBOL_HEIGHT * SH_FUNCTIONAL,
          false
        );
        addSidebarItem(
          graph,
          sidebar,
          HEART_PATH,
          SYMBOL_WIDTH * SW_EMOTIONAL,
          SYMBOL_HEIGHT * SH_EMOTIONAL,
          false
        );
        addSidebarItem(
          graph,
          sidebar,
          NEGATIVE_PATH,
          SYMBOL_WIDTH * SW_NEGATIVE,
          SYMBOL_HEIGHT * SH_NEGATIVE,
          false
        );
        addSidebarItem(
          graph,
          sidebar,
          CLOUD_PATH,
          SYMBOL_WIDTH * SW_QUALITY,
          SYMBOL_HEIGHT * SH_QUALITY,
          false
        );
        addSidebarItem(graph, sidebar, LINE_PATH, LINE_SIZE, LINE_SIZE, true);
        sidebar.addLine();
      }
    }

    return () => {
      // sidebar.destroy();
      if (divSidebar.current) {
        console.log("sidebar element exist");
        divSidebar.current.innerHTML = "";
      }
    };
  }, [graph]);

  return (
    <div id={SIDEBAR_DIV_ID} ref={divSidebar}>
      {<label htmlFor="choose_colours">Select Colour: </label>}
    </div>
  );
};

export default GraphSidebar;
