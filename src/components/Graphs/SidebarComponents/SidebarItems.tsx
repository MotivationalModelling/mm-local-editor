import {useEffect, useRef} from "react";
import {Graph, MaxToolbar, Cell, CellStateStyle, Geometry, Point, gestureUtils} from "@maxgraph/core";

import {addGoalRelationshipLabels, getSymbolConfigByShape} from "../../utils/GraphUtils";
import {useFileContext} from "../../context/FileProvider.tsx";
import {Label, newTreeGoal} from "../../types.ts";
import {addGoal, addGoalToTree} from "../../context/treeDataSlice.ts";

import {
    LINE_IMAGE_PATH,
    VERTEX_FONT,
    LINE_SIZE,
    SYMBOL_WIDTH,
    SYMBOL_HEIGHT,
    SYMBOL_CONFIGS, SymbolConfig,
} from "../../utils/GraphConstants";

const lineSymbol: SymbolConfig = {
    type: "Line",
    shape: "lineShape",
    imagePath: LINE_IMAGE_PATH,
    scale: {width: 0.9, height: 0.96},
    label: "Line",
};

type SidebarItemsProps = {
    graph: Graph
    className?: string
}

const SidebarItems = ({graph, className=""}: SidebarItemsProps) => {
    const divSidebar = useRef<HTMLDivElement>(null);
    const {dispatch} = useFileContext();

    const createSymbolCell = (symbol: SymbolConfig): Cell => {
        const width = SYMBOL_WIDTH * symbol.scale.width;
        const height = SYMBOL_HEIGHT * symbol.scale.height;

        if (!symbol.imagePath) {
            throw new Error(`No image path for symbol: ${symbol.type}`);
        }

        const shapeStyle: CellStateStyle = {
            fontSize: VERTEX_FONT.size,
            fontColor: VERTEX_FONT.color,
            shape: symbol.shape,
            ...symbol.shapeStyle    // Add custom rules for certain shapes
        };

        graph.getStylesheet().putCellStyle("minWidth", shapeStyle);
        graph.getStylesheet().putCellStyle("minHeight", shapeStyle);

        const prototype = new Cell(
            null,
            new Geometry(0, 0, width, height),
            shapeStyle
        );
        prototype.setVertex(true);
        return prototype;
    };

    const createEdgeCell = (width: number, height: number): Cell => {
        const prototype = new Cell(null, new Geometry(0, 0, width, height));

        if (prototype.geometry) {
            prototype.geometry.relative = true;
            prototype.setEdge(true);
        }
        return prototype;
    };

    const dragAndDrop = (prototype: Cell) => (graph: Graph, evt: MouseEvent, cell: Cell | null): void => {
        graph.stopEditing(false);
        const goal = graph.cloneCell(prototype);

        if (goal) {
            const treeItem = newTreeGoal({
                type: getSymbolConfigByShape(String(goal.style.shape))?.label as Label
            });
            dispatch(addGoal(treeItem));
            dispatch(addGoalToTree(treeItem));
        }
    };

    const dragAndDropEdge = (prototype: Cell) => (
        graph: Graph,
        evt: MouseEvent,
        cell: Cell | null
    ) => {
        graph.stopEditing(false);
        const point = graph.getPointForEvent(evt);
        const goal = graph.cloneCell(prototype);

        if (goal?.geometry) {
            goal.geometry.setTerminalPoint(new Point(point.x, point.y), true);
            goal.geometry.setTerminalPoint(
                new Point(point.x + LINE_SIZE, point.y + LINE_SIZE),
                false
            );
            goal.parent = graph.getDefaultParent();
            const [edge] = graph.importCells([goal], 0, 0, cell);
            if (edge) addGoalRelationshipLabels(graph, edge);
        }
    };

    const addSidebarItem = (
        graph: Graph,
        sidebar: MaxToolbar,
        symbol: SymbolConfig,
        dragAndDropHandler: ((graph: Graph) => void) | ((graph: Graph, evt: MouseEvent, cell: Cell | null) => void)
) => {
        const sidebarItem = sidebar.addMode(
            null,
            symbol.imagePath,
            dragAndDrop,
            symbol.imagePath
        );
        sidebarItem.style.width = (symbol.type === "Stakeholder") ? "30px" : "60px";

        gestureUtils.makeDraggable(sidebarItem, graph, dragAndDropHandler);
    };

    useEffect(() => {
        // return if divSidebar hasn't been initialised yet or if it already has items in it
        if (!divSidebar.current || divSidebar.current.children.length > 0) return;
        divSidebar.current.style.display = "flex";
        divSidebar.current.style.flexDirection = "column";
        divSidebar.current.style.alignItems = "center";

        const sidebar = new MaxToolbar(divSidebar.current);
        sidebar.enabled = false;

        // Add all symbol nodes to the sidebar
        Object.values(SYMBOL_CONFIGS)
            .filter((symbol) => symbol.type !== "Crowd")   // skip the crowd symbol since it stands for a group of stakeholders
            .forEach((symbol) => {
                addSidebarItem(
                    graph,
                    sidebar,
                    symbol,
                    dragAndDrop(createSymbolCell(symbol))
                );
            });

        // Add the edge prototype separately
        addSidebarItem(graph, sidebar, lineSymbol, dragAndDropEdge(createEdgeCell(LINE_SIZE, LINE_SIZE)));
    }, [divSidebar.current]);

    return <div className={`border border-black p-1 rounded ${className}`}
                ref={divSidebar}/>;
};

export default SidebarItems;
