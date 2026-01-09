import {Graph} from "@maxgraph/core";
import SidebarBody from "./SidebarComponents/SidebarBody";
import SidebarItems from "./SidebarComponents/SidebarItems.tsx";
import "./SideBar.css";

type recentreViewFunction = () => void;

type GraphSidebarProps = {
  graph: Graph | null;
  recentreView: recentreViewFunction;
};

const GraphSidebar = ({graph, recentreView}: GraphSidebarProps) => {
    return (
        <div className="responsive-sidebar" style={{ width: 'fit-content'}}>

            <SidebarBody graph={graph}
                         recentreView={recentreView}
                         className="mt-1"/>
            {(graph) && (
                <SidebarItems className="mt-1" graph={graph}/>
            )}
        </div>
    );
};

export default GraphSidebar;
