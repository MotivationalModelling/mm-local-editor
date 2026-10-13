import {Graph} from "@maxgraph/core";
import SidebarBody from "./SidebarComponents/SidebarBody";
import SidebarItems from "./SidebarComponents/SidebarItems.tsx";

type recentreViewFunction = () => void;

type GraphSidebarProps = {
  graph: Graph | null;
  recentreView: recentreViewFunction;
  onFunctionalGoalAdded: (goalId: number) => void;
};

const GraphSidebar = ({graph, recentreView, onFunctionalGoalAdded}: GraphSidebarProps) => {
    return (
        <div>
            <SidebarBody graph={graph}
                         recentreView={recentreView}
                         className="mt-1"/>
            {(graph) && (
                <SidebarItems className="mt-1" graph={graph} onFunctionalGoalAdded={onFunctionalGoalAdded}/>
            )}
        </div>
    );
};

export default GraphSidebar;
