import React, {Dispatch, useState} from "react";
import "./ProgressBar.css";
import { Popover, OverlayTrigger } from "react-bootstrap";
import {BsFillTrash3Fill, BsInfoCircleFill, BsPlus} from "react-icons/bs";
import {MdDelete, MdEdit} from "react-icons/md";
import ShowGoalSectionButton from "./header/ShowGoalSectionButton.tsx";

enum TabOptions {
  Cluster,
  Graph,
}

interface ProgressBarProps {
    showGoalSection: boolean
    setShowGoalSection: Dispatch<React.SetStateAction<boolean>>
    setShowGraphSection: (showGraphSection: boolean) => void
}

const ProgressBar = ({
                         showGoalSection,
                         setShowGoalSection,
                         setShowGraphSection,
                     }: ProgressBarProps) => {
  const [selectedTab, setSelectedTab] = useState(TabOptions.Cluster);

  const handleClusterBarClick = () => {
    setSelectedTab(TabOptions.Cluster);
    setShowGoalSection(true);
    setShowGraphSection(false);
  };

  const handleGraphBarClick = () => {
    setSelectedTab(TabOptions.Graph);
    setShowGoalSection(false);
    setShowGraphSection(true);
  };

  const clusterInfoPopover = (
    <Popover style={{ maxWidth: "max-content" }}>
      <Popover.Body>
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
        • Drag a goal in the left section to adjust the hierarchy. 
        Drag a goal within the cluster to the left or right to create a hierarchical structure
        <br />
        • Hide or expand sub-goals by clicking the – / + icon
        <br />
        • Hover over a goal and click <MdEdit /> to edit its name
        <br />
        • Hover over a goal and click <MdDelete /> to delete the goal
        <br />
      </Popover.Body>

    </Popover>
  );

  const graphInfoPopover = (
    <Popover style={{ maxWidth: "max-content" }}>
      <Popover.Body>
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
        <br />
      </Popover.Body>
    </Popover>
  );

  return (
      <div style={{
          width: "auto",
          minWidth: "1280px",
          overflowY: "hidden",
          maxWidth: "100%",
      }}>
      <div className="arrow-steps clearfix mb-1">
          <div className={`step ${(selectedTab === TabOptions.Cluster) ? "current" : ""}`}
               id="clusterTab"
               onClick={handleClusterBarClick}>
              <span>
                Enter Goals / Arrange Hierarchy
                <OverlayTrigger trigger="click"
                                placement="right"
                                overlay={clusterInfoPopover}>
                    <span>
                        <BsInfoCircleFill className="ms-1"/>
                    </span>
                </OverlayTrigger>
              </span>
          </div>
          <div className={`step ${(selectedTab === TabOptions.Graph) ? "current" : ""}`}
               id="graphTab"
               onClick={handleGraphBarClick}>
          <span>
              Arrange Hierarchy / Render Model
              <OverlayTrigger trigger="click"
                              placement="left"
                              overlay={graphInfoPopover}>
                  <span>
                      <BsInfoCircleFill className="ms-1"/>
                  </span>
              </OverlayTrigger>
              <ShowGoalSectionButton showGoalSection={showGoalSection}
                                     onClick={(ev) => {
                                         setShowGoalSection(!showGoalSection);
                                         ev.stopPropagation();
                                     }}
                                     // make button stand out on dark background colour
                                     variant={(selectedTab === TabOptions.Graph) ? "info" : undefined}
                                     size="xs"
                                     className="ms-1"/>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
