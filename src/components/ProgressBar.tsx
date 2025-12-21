import React, {Dispatch, useState} from "react";
import "./ProgressBar.css";
import { Popover, OverlayTrigger } from "react-bootstrap";
import {BsFillTrash3Fill, BsInfoCircleFill, BsPlus} from "react-icons/bs";
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
        • Click <strong><BsFillTrash3Fill /></strong> or{" "}
        <strong><code>[Delete Selected]</code></strong> to delete a goal
        <br />
        • Click <strong><BsPlus /></strong> or click the last goal entry in the goal list and press{" "}
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
        • Drag a goal within the cluster to the left or right to create a hierarchical structure
        <br />
        • Hide or expand sub-goals by clicking the – / + icon
        <br />
      </Popover.Body>

    </Popover>
  );

  const graphInfoPopover = (
    <Popover style={{ maxWidth: "max-content" }}>
      <Popover.Body>
        • Click{" "}
        <strong>
          <code>Edit All</code>
        </strong>{" "}
        on the left section to edit the names of goals <br />• Click{" "}
        <strong>
          <code>Drag All</code>
        </strong>{" "}
        on the left section to drag the cluster into the graph on the right
        section
        <br />• Click{" "}
        <strong>
          <code>Render</code>
        </strong>{" "}
        on the left section to generate the goal modal
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
