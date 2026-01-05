import React, {Dispatch, useState} from "react";
import "./ProgressBar.css";
import {OverlayTrigger, Popover} from "react-bootstrap";
import {GraphUsageInfo} from "./UsageInfo/GraphUsageInfo";
import {ClusterUsageInfo} from "./UsageInfo/ClusterUsageInfo";
import ShowGoalSectionButton from "./header/ShowGoalSectionButton";
import {OverlayInfoIcon} from "./UsageInfo/OverlayInfoIcon";

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
                <OverlayTrigger
                  trigger="click"
                  placement="left"
                  rootClose
                  overlay={
                    <Popover>
                      <Popover.Body>
                        <ClusterUsageInfo />
                      </Popover.Body>
                    </Popover>
                  }
                >
                  <OverlayInfoIcon />
                </OverlayTrigger>
              </span>
          </div>
          <div className={`step ${(selectedTab === TabOptions.Graph) ? "current" : ""}`}
               id="graphTab"
               onClick={handleGraphBarClick}>
          <span>
              Arrange Hierarchy / Render Model
              <OverlayTrigger
                trigger="click"
                placement="left"
                rootClose
                overlay={
                  <Popover>
                    <Popover.Body>
                      <GraphUsageInfo />
                    </Popover.Body>
                  </Popover>
                }
              >
                <OverlayInfoIcon />
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
