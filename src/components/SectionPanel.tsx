import { useEffect, useRef, useState } from "react";
import { Resizable, ResizeCallback } from "re-resizable";
import "./SectionPanel.css";

const defaultStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderStyle: "solid",
  borderColor: "lightgrey",
  borderWidth: "1px",
  borderRadius: "3px",
};

const DEFINED_PROPOTIONS = {
  maxWidth: "80%",
  minWidth: "10%",
};

type SectionPanelProps = {
  showGoalSection: boolean;
  showGraphSection: boolean;
  paddingX: number;
};

const SectionPanel = ({
  showGoalSection,
  showGraphSection,
  paddingX,
}: SectionPanelProps) => {
  const [sectionOneWidth, setSectionOneWidth] = useState(0);
  const [sectionThreeWidth, setSectionThreeWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);

  const sectionTwoRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Handle section one resize and section three auto resize
  const handleResizeSectionOne: ResizeCallback = (
    event,
    direction,
    ref,
    delta
  ) => {
    setSectionOneWidth(ref.offsetWidth);
    // If the width sum exceed the parent total width, auto resize the section three until reach the minimum
    if (
      sectionTwoRef.current &&
      ref.offsetWidth + sectionTwoRef.current.offsetWidth + sectionThreeWidth >=
        parentWidth
    ) {
      setSectionThreeWidth(
        parentWidth - ref.offsetWidth - sectionTwoRef.current.offsetWidth
      );
    }
  };

  // Handle section three resize and section one auto resize
  const handleResizeSectionThree: ResizeCallback = (
    event,
    direction,
    ref,
    delta
  ) => {
    setSectionThreeWidth(ref.offsetWidth);
    // If the width sum exceed the parent total width, auto resize the section one until reach the minimum
    if (
      sectionTwoRef.current &&
      sectionOneWidth + sectionTwoRef.current.offsetWidth + ref.offsetWidth >=
        parentWidth
    ) {
      setSectionOneWidth(
        parentWidth - ref.offsetWidth - sectionTwoRef.current.offsetWidth
      );
    }
  };

  // Get the parent div inner width and set initial width for section three
  useEffect(() => {
    if (parentRef.current) {
      setParentWidth(parentRef.current?.clientWidth - paddingX * 2);
      setSectionThreeWidth(parentWidth * 0.5);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        padding: paddingX,
      }}
      ref={parentRef}
    >
      {/* Goal List Section */}
      <Resizable
        handleClasses={{ right: "right-handler" }}
        enable={{ right: true }}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          display: showGoalSection ? "flex" : "none",
        }}
        size={{ width: sectionOneWidth, height: "200px" }}
        maxWidth={DEFINED_PROPOTIONS.maxWidth}
        minWidth={DEFINED_PROPOTIONS.minWidth}
        onResize={handleResizeSectionOne}
      >
        {/* First Panel Content */}
        Section 1
      </Resizable>

      {/* Cluster Hierachy Section */}
      <div
        style={{
          ...defaultStyle,
          width: "100%",
          minWidth: DEFINED_PROPOTIONS.minWidth,
          height: 200,
          backgroundColor: "rgba(35, 144, 231, 0.1)",
        }}
        ref={sectionTwoRef}
      >
        Section 2
      </div>

      {/* Graph Render Section */}
      <Resizable
        handleClasses={{ left: "left-handler" }}
        enable={{ left: true }}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          display: showGraphSection ? "flex" : "none",
        }}
        size={{
          width: sectionThreeWidth,
          height: 200,
        }}
        maxWidth={DEFINED_PROPOTIONS.maxWidth}
        minWidth={DEFINED_PROPOTIONS.minWidth}
        onResize={handleResizeSectionThree}
      >
        {/* Third Panel Content */}
        Section 3
      </Resizable>
    </div>
  );
};

export default SectionPanel;
