import { useState } from "react";
import { ColorResult } from "react-color";
import { Graph } from "@maxgraph/core";
import ColorPicker from "./ColorPicker";
import SidebarBody from "./SidebarBody";

type recentreViewFunction = () => void;

type GraphSidebarProps = {
  graph: Graph | null;
  recentreView: recentreViewFunction;
};

const GraphSidebar = ({ graph, recentreView }: GraphSidebarProps) => {
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff");

  // Handler for changing colours
  const handleColorChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
    if (graph) {
      graph.getDataModel().beginUpdate();
      try {
        const cells = graph.getSelectionCells();
        for (let i = 0; i < cells.length; i++) {
          const style = graph.getCellStyle(cells[i]);
          style.fillColor = color.hex;
          graph.getDataModel().setStyle(cells[i], style);
          console.log("colour selected");
        }
      } finally {
        graph.getDataModel().endUpdate();
      }
    }
  };

  return (
    <div>
      <ColorPicker selectedColor={selectedColor} onColorChange={handleColorChange} />
      <SidebarBody graph={graph} recentreView={recentreView} />
    </div>
  );
};

export default GraphSidebar;
