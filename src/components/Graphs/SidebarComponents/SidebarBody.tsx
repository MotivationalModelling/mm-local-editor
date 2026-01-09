import {Graph} from "@maxgraph/core";
import ColorButtons from "./ColorButtons";
import ZoomButtons from "./ZoomButtons";
import ScaleTextButton from "../ScaleTextButton";
import {CollapsibleSidebarCard} from "./CollapsibleSidebarCard";

interface SidebarProps {
    graph: Graph | null
    recentreView: () => void
    className?: string
}

const SidebarBody = ({graph, recentreView, className}: SidebarProps) => {
    if (!graph) return null;

    return (
        <div className={`border border-black p-1 rounded ${className}`}
        style={{width: 'fit-content'}}>
            <CollapsibleSidebarCard isOpen title="Zoom">
                <ZoomButtons recentreView={recentreView}/>
            </CollapsibleSidebarCard>
            <CollapsibleSidebarCard title="Colour">
                <ColorButtons graph={graph}/>
            </CollapsibleSidebarCard>
            <CollapsibleSidebarCard title="Font size">
                <ScaleTextButton/>
            </CollapsibleSidebarCard>
        </div>
    );
};

export default SidebarBody;
