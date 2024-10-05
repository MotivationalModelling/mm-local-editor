import { Graph } from "@maxgraph/core";
import ColorButtons from "./ColorButtons";
import ZoomButtons from "./ZoomButtons";
import SidebarItems from "./SidebarItems";

const SIDEBAR_DIV_ID = "sidebarContainer";

type recentreViewFunction = () => void;

type SidebarProps = {
  graph: Graph | null;
  recentreView: recentreViewFunction;
};

const SidebarBody = ({ graph, recentreView }: SidebarProps) => {
  if (!graph) return null;

  return (
    <div id={SIDEBAR_DIV_ID}>
      <ColorButtons graph={graph} />
      <ZoomButtons graph={graph} recentreView={recentreView} />
      <SidebarItems graph={graph} />
    </div>
  );
};

export default SidebarBody;