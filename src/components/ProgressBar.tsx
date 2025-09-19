import React, {Dispatch, useState} from "react";
import "./ProgressBar.css";
import { Popover, OverlayTrigger } from "react-bootstrap";
import {BsInfoCircleFill} from "react-icons/bs";
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
        • Click the goal and use{" "}
        <strong>
          <code>[delete]</code>
        </strong>{" "}
        to delete a goal <br />• Click the last goal on the goal list and use{" "}
        <strong>
          <code>[return]</code>
        </strong>{" "}
        to generate a new goal <br />
        • Drag the goal from the goal list on the left section and drop it into
        the cluster on the right section
        <br />
        • Drag the goal in the cluster to the right or left sides to achieve the
        hierarchical structure <br />
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
                    <BsInfoCircleFill className="ms-1"/>
                </OverlayTrigger>
              </span>
          </div>
          <div className={`step ${selectedTab === TabOptions.Graph ? "current" : ""}`}
               id="graphTab"
               onClick={handleGraphBarClick}>
          <span>
              Arrange Hierarchy / Render Model
              <OverlayTrigger trigger="click"
                              placement="left"
                              overlay={graphInfoPopover}>
                  <BsInfoCircleFill className="ms-1"/>
              </OverlayTrigger>
              <ShowGoalSectionButton showGoalSection={showGoalSection}
                                     onClick={(ev) => {
                                         setShowGoalSection(!showGoalSection);
                                         ev.stopPropagation();
                                     }}
                                     size="sm"
                                     className="ms-1"/>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
