import {Graph} from "@maxgraph/core";
import ColorButtons from "./ColorButtons";
import ZoomButtons from "./ZoomButtons";
import SidebarItems from "./SidebarItems";
import ScaleTextButton from "../ScaleTextButton";
import {CollapsibleSidebarCard} from "./CollapsibleSidebarCard";

type SidebarProps = {
  graph: Graph | null;
  recentreView: () => void;
};

const SidebarBody = ({ graph, recentreView }: SidebarProps) => {
  if (!graph) return null;

  return (
    // <div id="sidebarContainer">
    <div>
      <CollapsibleSidebarCard title="Colour">
        <ColorButtons graph={graph} />
      </CollapsibleSidebarCard>
      <CollapsibleSidebarCard title="Font size">
        <ScaleTextButton/>
      </CollapsibleSidebarCard>
      <CollapsibleSidebarCard isOpen title="Zoom">
        <ZoomButtons graph={graph}
                     recentreView={recentreView} />
      </CollapsibleSidebarCard>
        <SidebarItems graph={graph} />
    </div>
  );
};

export default SidebarBody;
