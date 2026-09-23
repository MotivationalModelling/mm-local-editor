import {Graph} from "@maxgraph/core";
import SidebarBody, {type CanvasMode} from "./SidebarComponents/SidebarBody";
import SidebarItems from "./SidebarComponents/SidebarItems.tsx";

type recentreViewFunction = () => void;

export type {CanvasMode};

type GraphSidebarProps = {
    graph: Graph | null;
    recentreView: recentreViewFunction;
    canvasMode: CanvasMode;
    onCanvasModeChange: (mode: CanvasMode) => void;
};

const GraphSidebar = ({graph, recentreView, canvasMode, onCanvasModeChange}: GraphSidebarProps) => {
    return (
        <div>
            <SidebarBody graph={graph}
                         recentreView={recentreView}
                         canvasMode={canvasMode}
                         onCanvasModeChange={onCanvasModeChange}
                         className="mt-1"/>
            {(graph) && (
                <SidebarItems className="mt-1" graph={graph}/>
            )}
        </div>
    );
};

export default GraphSidebar;
