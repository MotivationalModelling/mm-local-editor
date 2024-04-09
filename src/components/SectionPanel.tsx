import { Resizable } from "re-resizable";
import "./SectionPanel.css";

const defaultStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "solid 1px #ddd",
};

const SectionPanel = () => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        padding: "15px",
      }}
    >
      <Resizable
        bounds="parent"
        handleClasses={{ right: "right-handler" }}
        enable={{ right: true }}
        style={{ ...defaultStyle, backgroundColor: "rgb(236, 244, 244)" }}
        defaultSize={{ width: "50%", height: "200px" }}
        maxWidth="90%"
        minWidth="10%"
      >
        {/* First Panel Content */}
        Section 1
      </Resizable>

      <div
        style={{
          ...defaultStyle,
          width: "100%",
          backgroundColor: "rgba(35, 144, 231, 0.1)",
        }}
      >
        {/* Second Panel Content */}
        Section 2
      </div>
    </div>
  );
};

export default SectionPanel;
