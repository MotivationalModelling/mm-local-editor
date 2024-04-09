import { Resizable } from "re-resizable";
import "./SectionPanel.css";

const defaultStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "solid 1px #ddd",
};

type SectionPanelProps = {
  showGoalSection: boolean;
};

const SectionPanel = ({ showGoalSection }: SectionPanelProps) => {
  return (
    <div
      style={{
        // width: "100%",
        display: "flex",
        padding: "15px",
      }}
    >
      <Resizable
        // bounds="parent"
        handleClasses={{ right: "right-handler" }}
        enable={{ right: true }}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          display: showGoalSection ? "" : "none",
        }}
        defaultSize={{ width: "30%", height: "200px" }}
        maxWidth="80%"
        minWidth="10%"
      >
        {/* First Panel Content */}
        Section 1
      </Resizable>

      <div
        style={{
          ...defaultStyle,
          width: "100%",
          // display: "none",
          backgroundColor: "rgba(35, 144, 231, 0.1)",
        }}
      >
        Section 2
      </div>
      <Resizable
        // bounds="parent"
        handleClasses={{ left: "left-handler" }}
        enable={{ left: true }}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          // display: "none",
        }}
        defaultSize={{ width: "30%", height: "200px" }}
        maxWidth="80%"
        minWidth="10%"
      >
        {/* Third Panel Content */}
        Section 3
      </Resizable>
    </div>
  );
};

export default SectionPanel;
