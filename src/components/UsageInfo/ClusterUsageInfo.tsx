import {BsFillTrash3Fill, BsPlus, BsPencilSquare} from "react-icons/bs";


export const ClusterUsageInfo = () => {
    return (
        <>
            <strong>General Instructions:</strong>
            <br />
            • Drag the divider between the two panels to the left or right to adjust the panel width
            <br />
            <br />
            <strong>Goal List Panel:</strong>
            <br />
            • There are five types of entities that can be added to the goal list: Do, Be, Feel, Concern, and Who.
            Click on different categories to manage the corresponding goals
            <br />
            • Click <BsPlus /> or click the last goal entry in the goal list and press{" "}
            <strong><code>[Enter]</code></strong> to create a new goal
            <br />
            • Click <BsFillTrash3Fill /> or{" "}
            <strong><code>[Delete Selected]</code></strong> to delete a goal
            <br />
            <br />
            <strong>Creating Hierarchy View:</strong>
            <br />
            • To add goals to the hierarchy view, drag a goal from the goal list
            <br />
            and drop it into the cluster on the right, or select goals and click the{" "}
            <strong><code>[Add Group]</code></strong> button
            <br />
            <br />
            <strong>Hierarchy Panel:</strong>
            <br />
            • Drag a goal within the cluster to the left or right to adjust the hierarchical structure.
            Drag to the right to deepen the hierarchy, and to the left to move it up a level
            <br />
            • Hide or expand sub-goals by clicking the – / + icon
            <br />
            • Hover over a goal and click <BsPencilSquare /> to edit its name
            <br />
            • Hover over a goal and click <BsFillTrash3Fill /> to delete the goal
        </>
    );
};

