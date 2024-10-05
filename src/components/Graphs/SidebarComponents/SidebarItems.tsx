import { useEffect, useRef } from "react";
import { Graph, MaxToolbar, Cell, CellStateStyle, Geometry, Point, gestureUtils } from "@maxgraph/core";
import {
  NEGATIVE_SHAPE,
  PERSON_SHAPE,
  CLOUD_SHAPE,
  PARALLELOGRAM_SHAPE,
  HEART_SHAPE,
} from "../GraphShapes";

const LINE_SIZE = 50;
const SYMBOL_WIDTH = 145;
const SYMBOL_HEIGHT = 110;

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

const VERTEX_FONT_SIZE = 16;
const VERTEX_FONT_COLOUR = "black";

const PARALLELOGRAM_PATH = "img/Function.png";
const HEART_PATH = "img/Heart.png";
const NEGATIVE_PATH = "img/Risk.png";
const CLOUD_PATH = "img/Cloud.png";
const PERSON_PATH = "img/Stakeholder.png";
const LINE_PATH = "img/line.svg";

type SidebarItemsProps = {
  graph: Graph;
};

const SidebarItems = ({ graph }: SidebarItemsProps) => {
  const divSidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divSidebar.current) return;

    let sidebar = new MaxToolbar(divSidebar.current);
    sidebar.enabled = false;

    const addSidebarItem = (
      graph: Graph,
      sidebar: MaxToolbar,
      imagePath: string,
      width: number,
      height: number,
      isEdge: boolean
    ) => {
      let type = "";
      let data = "";
      let prototype: Cell;

      if (!isEdge) {
        let shape = "";
        switch (imagePath) {
          case PARALLELOGRAM_PATH:
            shape = PARALLELOGRAM_SHAPE;
            type = "Functional";
            data = "functionaldata";
            break;
          case HEART_PATH:
            shape = HEART_SHAPE;
            type = "Emotional";
            data = "emotionaldata";
            break;
          case NEGATIVE_PATH:
            shape = NEGATIVE_SHAPE;
            type = "Negative";
            data = "negativedata";
            break;
          case CLOUD_PATH:
            shape = CLOUD_SHAPE;
            type = "Quality";
            data = "qualitydata";
            break;
          case PERSON_PATH:
            shape = PERSON_SHAPE;
            type = "Stakeholder";
            data = "stakeholderdata";
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

      const dragAndDrop = (
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

      const dragAndDropEdge = (
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
  }, [graph]);

  return <div ref={divSidebar}></div>;
};

export default SidebarItems;