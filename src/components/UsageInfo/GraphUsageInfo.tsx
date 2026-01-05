import { MdDelete, MdEdit } from "react-icons/md";

export const GraphUsageInfo = () => {

  return (
    <>
      <strong>Hierarchy View:</strong>
      <br />
      • Drag a goal in the left section to adjust the hierarchy
      <br />
      • Hover over a goal and click <MdEdit /> to edit its name
      <br />
      • Hover over a goal and click <MdDelete /> to delete the goal
      <br />
      <br />
      <strong>Model View:</strong>
      <br />
      • Select and drag a goal to adjust its position on the graph
      <br />
      • Drag elements from the right toolbar onto the graph to add a goal
      <br />
      • Double-click the text under a goal in the graph to edit the goal name
    </>
  );
};
