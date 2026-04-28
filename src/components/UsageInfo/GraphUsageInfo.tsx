import {BsFillTrash3Fill, BsPencilSquare} from "react-icons/bs";

export const GraphUsageInfo = () => {

    return (
        <>
            <strong>General Instructions:</strong>
            <br />
            • Drag the divider between the two panels to the left or right to adjust the panel width
            <br />
            <br />
            <strong>Hierarchy Panel:</strong>
            <br />
            • Drag a goal within the cluster to the left or right to adjust the hierarchical structure.
            Drag to the right to deepen the hierarchy, and to the left to move it up a level
            <br />
            • Hover over a goal and click <BsPencilSquare /> to edit its name
            <br />
            • Hover over a goal and click <BsFillTrash3Fill /> to delete the goal
            <br />
            <br />
            <strong>Model Panel:</strong>
            <br />
            • Select and drag a goal to adjust its position on the graph
            <br />
            • Drag elements from the right toolbar onto the graph to add a goal
            <br />
            • Double-click the text under a goal in the graph to edit the goal name
        </>
    );
};
