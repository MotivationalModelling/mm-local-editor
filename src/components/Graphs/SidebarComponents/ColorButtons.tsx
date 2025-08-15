import { useEffect, useRef } from "react";
import { Graph, DomHelpers } from "@maxgraph/core";

const COLOUR_SET = ["#d54417", "#edd954", "#1a9850", "#ffffff"];

type ColorButtonsProps = {
  graph: Graph;
};

const ColorButtons = ({ graph }: ColorButtonsProps) => {
  const divSidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divSidebar.current) return;

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
      btn.style.height = "30px";
      btn.style.backgroundColor = colour;
      btn.style.border = "2px";

      switch (colour) {
        case "#d54417":
          btn.ariaLabel = "HIGH";
          btn.innerHTML = "HIGH";
          btn.style.fontSize = "12px";
          break;
        case "#edd954":
          btn.ariaLabel = "MEDIUM";
          btn.innerHTML = "MEDIUM";
          btn.style.fontSize = "12px";
          break;
        case "#1a9850":
          btn.ariaLabel = "LOW";
          btn.innerHTML = "LOW";
          btn.style.fontSize = "12px";
          break;
      }
      if (divSidebar.current) divSidebar.current.appendChild(btn);
    };

    for (let i = 0; i < COLOUR_SET.length; i++) {
      addButton(COLOUR_SET[i]);
    }
  }, [graph]);

  return <div ref={divSidebar}></div>;
};

export default ColorButtons;