import {BsFillTrash3Fill, BsPlus, BsPencilSquare} from "react-icons/bs";


export const ClusterUsageInfo = () => {
    return (
        <>
            <strong>Goal List:</strong>
            <br />
            • Click <BsFillTrash3Fill /> or{" "}
            <strong><code>[Delete Selected]</code></strong> to delete a goal
            <br />
            • Click <BsPlus /> or click the last goal entry in the goal list and press{" "}
            <strong><code>[Enter]</code></strong> to create a new goal
            <br />
            • To add goals to the hierarchy view, drag a goal from the goal list
            <br />
            and drop it into the cluster on the right, or select goals and click the{" "}
            <strong><code>[Add Group]</code></strong> button
            <br />
            <br />
            <strong>Hierarchy View:</strong>
            <br />
            • Drag a goal in the left section to adjust the hierarchy
            <br />
            • Drag a goal within the cluster to the left or right to create a hierarchical structure
            <br />
            • Hide or expand sub-goals by clicking the – / + icon
            <br />
            • Hover over a goal and click <BsPencilSquare /> to edit its name
            <br />
            • Hover over a goal and click <BsFillTrash3Fill /> to delete the goal
        </>
    );
};

