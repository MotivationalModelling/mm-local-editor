import { useEffect, useRef, useState } from "react";
import { Resizable, ResizeCallback } from "re-resizable";
import "./SectionPanel.css";
import GoalList from "./GoalList";

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

const INITIAL_PROPORTIONS = {
  sectionOne: 0.5,
  sectionThree: 0.75,
  sectionsCombine: {
    sectionOne: 0.2,
    sectionThree: 0.5,
  }
};

type SectionPanelProps = {
  showGoalSection: boolean;
  showGraphSection: boolean;
  setShowGoalSection: React.Dispatch<React.SetStateAction<boolean>>;
  paddingX: number;
};

const SectionPanel = ({
  showGoalSection,
  showGraphSection,
  setShowGoalSection,
  paddingX,
}: SectionPanelProps) => {
  const [sectionOneWidth, setSectionOneWidth] = useState(0);
  // const [sectionOneHeight, setSectionOneHeight] = useState("100%");
  const [sectionThreeWidth, setSectionThreeWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);

  const sectionTwoRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const goalListRef = useRef(null);

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
    console.log(
      sectionOneWidth,
      sectionTwoRef.current?.offsetWidth,
      ref.offsetWidth
    );
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

  // Get the parent div inner width and set starter width for section one and section three
  useEffect(() => {
    if (parentRef.current) {
      const newParentWidth = parentRef.current.clientWidth - paddingX * 2;
      setParentWidth(newParentWidth)

      if (showGoalSection && showGraphSection) {
        console.log(showGoalSection);
        setSectionOneWidth(newParentWidth * INITIAL_PROPORTIONS.sectionsCombine.sectionOne);
        setSectionThreeWidth(newParentWidth * INITIAL_PROPORTIONS.sectionsCombine.sectionThree);
      } else if (showGoalSection) {
        setSectionOneWidth(newParentWidth * INITIAL_PROPORTIONS.sectionOne);
      } else if (showGraphSection) {
        setSectionThreeWidth(newParentWidth * INITIAL_PROPORTIONS.sectionThree);
      } else {
        setSectionOneWidth(newParentWidth * INITIAL_PROPORTIONS.sectionOne);
        setSectionThreeWidth(newParentWidth * INITIAL_PROPORTIONS.sectionThree);
      }
    }
  }, [showGoalSection]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
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
          minHeight: "200px",
        }}
        size={{ width: sectionOneWidth, height: "100%" }}
        maxWidth={DEFINED_PROPOTIONS.maxWidth}
        minWidth={DEFINED_PROPOTIONS.minWidth}
        onResize={handleResizeSectionOne}
      >
        {/* First Panel Content */}
        <GoalList ref={goalListRef} />
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
        <button
          onClick={() => setShowGoalSection(!showGoalSection)}
          style={{ marginLeft: "20px" }}
        >
          Show Section 1
        </button>
      </Resizable>
    </div>
  );
};

export default SectionPanel;
