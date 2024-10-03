import { useEffect, useRef } from "react";
import { Graph, MaxToolbar } from "@maxgraph/core";

const ZOOMIN_PATH = "img/zoomin.svg";
const ZOOMOUT_PATH = "img/zoomout.svg";
const CENTRE_PATH = "img/centre.svg";

type ZoomButtonsProps = {
  graph: Graph;
  recentreView: () => void;
};

const ZoomButtons = ({ graph, recentreView }: ZoomButtonsProps) => {
  const divSidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divSidebar.current) return;

    let sidebar = new MaxToolbar(divSidebar.current);
    sidebar.enabled = false;

    sidebar.addLine();
    const zoomIn = sidebar.addItem("Zoom In", ZOOMIN_PATH, () => {
      graph.zoomIn();
    });
    zoomIn.style.width = "20px";

    const centre = sidebar.addItem("centre", CENTRE_PATH, () => {
      recentreView();
    });
    centre.style.width = "20px";

    const zoomOut = sidebar.addItem("Zoom Out", ZOOMOUT_PATH, () => {
      graph.zoomOut();
    });
    zoomOut.style.width = "20px";
    sidebar.addLine();

    return () => {
      if (divSidebar.current) {
        divSidebar.current.innerHTML = "";
      }
    };
  }, [graph, recentreView]);

  return <div ref={divSidebar}></div>;
};

export default ZoomButtons;