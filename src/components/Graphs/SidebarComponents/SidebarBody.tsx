import { Graph } from "@maxgraph/core";
import ColorButtons from "./ColorButtons";
import ZoomButtons from "./ZoomButtons";
import SidebarItems from "./SidebarItems";
import ScaleTextButton from "../ScaleTextButton";
import { CollapsibleSidebarCard } from "./CollapsibleSidebarCard";

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
      <CollapsibleSidebarCard title="Colour">
        <ColorButtons graph={graph} />
      </CollapsibleSidebarCard>
      <CollapsibleSidebarCard title="Font Size">
        <ScaleTextButton/>
      </CollapsibleSidebarCard>
      <CollapsibleSidebarCard title="Zoom">
        <ZoomButtons graph={graph} recentreView={recentreView} />
      </CollapsibleSidebarCard>
        <SidebarItems graph={graph} />
    </div>
  );
};

export default SidebarBody;
