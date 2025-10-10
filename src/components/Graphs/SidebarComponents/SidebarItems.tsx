import {useEffect, useRef} from "react";
import {Graph, MaxToolbar, Cell, CellStateStyle, Geometry, Point, gestureUtils} from "@maxgraph/core";

import {getSymbolConfigByShape} from "../../utils/GraphUtils";
import {Label, newTreeItem, useFileContext} from "../../context/FileProvider.tsx";
import {addGoal, addGoalToTree} from "../../context/treeDataSlice.ts";

import {
  LINE_IMAGE_PATH,
  VERTEX_FONT,
  LINE_SIZE,
  SYMBOL_WIDTH,
  SYMBOL_HEIGHT,
  SYMBOL_CONFIGS,
} from "../../utils/GraphConstants";

type SidebarItemsProps = {
    graph: Graph
    className?: string
}

const SidebarItems = ({graph, className=""}: SidebarItemsProps) => {
    const divSidebar = useRef<HTMLDivElement>(null);
    const {dispatch} = useFileContext();

    const addSidebarItem = (
      graph: Graph,
      sidebar: MaxToolbar,
      imagePath: string,
      width: number,
      height: number,
      isEdge: boolean
    ) => {
      let prototype: Cell;
      if (!isEdge) {
        // Try to find matching symbol config by image path
        const symbolEntry = Object.entries(SYMBOL_CONFIGS).find(
          ([, config]) => config.imagePath === imagePath
        );

        if (!symbolEntry) {
          console.warn(`No symbol config found for image path: ${imagePath}`);
          return;
        }

        const [symbolKey, config] = symbolEntry;

        let shapeStyle: CellStateStyle = {
          fontSize: VERTEX_FONT.size,
          fontColor: VERTEX_FONT.color,
          shape: config.shape,
        };

        graph.getStylesheet().putCellStyle("minWidth", shapeStyle);
        graph.getStylesheet().putCellStyle("minHeight", shapeStyle);

        // Add custom rules for certain shapes (XXX use shapeStyle from config)
        if (symbolKey === 'STAKEHOLDER') {
          shapeStyle = {
            ...shapeStyle,
            verticalAlign: 'top',
            verticalLabelPosition: 'bottom',
            autoSize: false,
          };
        } else if (symbolKey === 'NEGATIVE') {
          shapeStyle = {
            ...shapeStyle,
            fillColor: 'grey',
          };
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
        const goal = graph.cloneCell(prototype);
        
        if (goal) {
          const treeItem = newTreeItem({
            type: getSymbolConfigByShape(String(goal.style.shape))?.label as Label
          });
          dispatch(addGoal(treeItem));
          dispatch(addGoalToTree(treeItem));
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
        const goal = graph.cloneCell(prototype);

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

      if (imagePath == SYMBOL_CONFIGS.STAKEHOLDER.imagePath) {
        sidebarItem.style.width = "30px";
      }
      if (!isEdge) {
        gestureUtils.makeDraggable(sidebarItem, graph, dragAndDrop);
      } else {
        gestureUtils.makeDraggable(sidebarItem, graph, dragAndDropEdge);
        sidebarItem.style.width = "50px";
      }
    };

  useEffect(() => {
    if (!divSidebar.current) return;

    const sidebar = new MaxToolbar(divSidebar.current);
    sidebar.enabled = false;

    // Add all symbol nodes to the sidebar
    Object.values(SYMBOL_CONFIGS).forEach(config => {
      addSidebarItem(
        graph,
        sidebar,
        config.imagePath,
        SYMBOL_WIDTH * config.scale.width,
        SYMBOL_HEIGHT * config.scale.height,
        false
      );
    });

    // Add the edge prototype separately
    addSidebarItem(graph, sidebar, LINE_IMAGE_PATH, LINE_SIZE, LINE_SIZE, true);
  }, [graph]);

  return <div className={`border border-black p-1 rounded ${className}`}
              ref={divSidebar}/>;
};

export default SidebarItems;