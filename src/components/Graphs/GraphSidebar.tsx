import { useState } from "react";
import { ColorResult } from "react-color";
import { Graph } from "@maxgraph/core";
import ColorPicker from "./SidebarComponents/ColorPicker";
import SidebarBody from "./SidebarComponents/SidebarBody";

type recentreViewFunction = () => void;

type GraphSidebarProps = {
  graph: Graph | null;
  recentreView: recentreViewFunction;
};

const GraphSidebar = ({graph, recentreView}: GraphSidebarProps) => {
    const [selectedColor, setSelectedColor] = useState<string>("#ffffff");

    // Handler for changing colours
    const handleColorChange = (color: ColorResult) => {
        setSelectedColor(color.hex);
        if (graph) {
            graph.getDataModel().beginUpdate();
            try {
                for (const cell of graph.getSelectionCells()) {
                    const style = graph.getCellStyle(cell);

                    style.fillColor = color.hex;
                    graph.getDataModel().setStyle(cell, style);
                }
            } finally {
                graph.getDataModel().endUpdate();
            }
        }
    };

    return (
        <div>
            <ColorPicker selectedColor={selectedColor} onColorChange={handleColorChange}/>
            <SidebarBody graph={graph} recentreView={recentreView}/>
        </div>
    );
};

export default GraphSidebar;
