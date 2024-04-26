import React, { useEffect, useRef, useState } from "react";
import { Resizable, ResizeCallback } from "re-resizable";
import "./SectionPanel.css";
import GoalList from "./GoalList";
import Tree from "./Tree";
import { Button } from "react-bootstrap";
import ErrorModal from "./ErrorModal";
import GraphRender from "./GraphRender";

// use for testing xml validation only
const xmlData =
  '<root><mxCell id="2" value="Hello," vertex="1"><mxGeometry x="20" y="20" width="80" height="30" as="geometry"/></mxCell><mxCell id="3" value="World!" vertex="1"><mxGeometry x="200" y="150" width="80" height="30" as="geometry"/></mxCell><mxCell id="4" value="" edge="1" source="2" target="3"><mxGeometry relative="1" as="geometry"/></mxCell></root>';
const defaultStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  borderStyle: "solid",
  borderColor: "lightgrey",
  borderWidth: "1px",
  borderRadius: "3px",
};

const DEFINED_PROPORTIONS = {
  maxWidth: "80%",
  minWidth: "10%",
};

const INITIAL_PROPORTIONS = {
  sectionOne: 0.5,
  sectionThree: 0.75,
  sectionsCombine: {
    sectionOne: 0.2,
    sectionThree: 0.5,
  },
};

const DEFAULT_HEIGHT = "800px";

type SectionPanelProps = {
  showGoalSection: boolean;
  showGraphSection: boolean;
  setShowGoalSection: React.Dispatch<React.SetStateAction<boolean>>;
  paddingX: number;
};

export type TreeItem = {
  id: number;
  content: string;
  type: Label;
  children?: TreeItem[];
};

// Define the structure for the content of each tab
export type TabContent = {
  label: Label;
  icon: string;
  rows: TreeItem[];
};

export type Label = "Who" | "Do" | "Be" | "Feel" | "Concern";

// Dummy data
const items: TreeItem[] = [
  {
    id: 0,
    content: "Do 1",
    type: "Do",
    children: [
      { id: 1, content: "Be 1", type: "Be" },
      { id: 2, content: "Role 2", type: "Who" },
      {
        id: 3,
        content: "Do 7",
        type: "Do",
        children: [{ id: 4, content: "Be 1", type: "Be" }],
      },
    ],
  },
  {
    id: 5,
    content: "Do 3",
    type: "Do",
    children: [
      { id: 6, content: "Role 5", type: "Who" },
      { id: 7, content: "Be 3", type: "Be" },
      { id: 8, content: "Feel 1", type: "Feel" },
    ],
  },
];

const SectionPanel = ({
  showGoalSection,
  showGraphSection,
  setShowGoalSection,
  paddingX,
}: SectionPanelProps) => {
  const [sectionOneWidth, setSectionOneWidth] = useState(0);
  const [sectionThreeWidth, setSectionThreeWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);

  const [draggedItem, setDraggedItem] = useState<TreeItem | null>(null);
  const [treeData, setTreeData] = useState<TreeItem[]>(items);
  // Simply store ids of all items in the tree for fast check instead of recursive search
  const [treeIds, setTreeIds] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const [tabData, setTabData] = useState<TabContent[]>([]);
  const [groupSelected, setGroupSelected] = useState<TreeItem[]>([]);
  const [itemExist, setItemExist] = useState<[number, boolean]>([0, false]);
  const [groupItemsExist, setGroupItemsExist] = useState<boolean>(false);

  const sectionTwoRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const goalListRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Handle section one resize and section three auto resize
  const handleResizeSectionOne: ResizeCallback = (_event, _direction, ref) => {
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
  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle section three resize and section one auto resize
  const handleResizeSectionThree: ResizeCallback = (
    _event,
    _direction,
    ref
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

  // Handle for goals drop on the nestable section
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const delayTime = 1500;
    if (draggedItem && draggedItem.content) {
      if (!treeIds.includes(draggedItem.id)) {
        const newData: TreeItem[] = [...treeData, draggedItem];
        setTreeData(newData);
        setTreeIds([...treeIds, draggedItem.id]);
        console.log("drop successful");
      } else {
        setItemExist([draggedItem.id, true]);
        // Clear previous timeout
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
        }
        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          setItemExist([draggedItem.id, false]);
        }, delayTime);
        console.log("drop failed");
      }
    }
  };

  // Add selected items where they are not in the tree to the tree and reset selected items, uncheck the checkboxes
  const handleDropGroupSelected = () => {
    // Filter groupSelected to get only objects whose IDs are not in treeData
    const newItemsToAdd = groupSelected.filter(
      (item) => !treeIds.includes(item.id)
    );

    console.log(newItemsToAdd);

    // If all items are in the tree, then show the warning
    if (newItemsToAdd.length === 0) {
      setGroupItemsExist(true);
      return;
    }
    // Update treeData with new items, filter out the empty items
    setTreeData((prevTreeData) => [
      ...prevTreeData,
      ...newItemsToAdd.filter((item) => item.content.trim() !== ""),
    ]);
    // Update Ids with new items, filter out the empty items
    setTreeIds((prevIds) => [
      ...prevIds,
      ...newItemsToAdd
        .filter((item) => item.content.trim() !== "")
        .map((item) => item.id),
    ]);
    setGroupSelected([]);
  };

  const handleGroupDropModal = () => {
    setGroupItemsExist(false);
    setGroupSelected([]);
  };

  // Get the parent div inner width and set starter width for section one and section three
  useEffect(() => {
    if (parentRef.current) {
      const newParentWidth = parentRef.current.clientWidth - paddingX * 2;
      setParentWidth(newParentWidth);

      if (showGoalSection && showGraphSection) {
        setSectionOneWidth(
          newParentWidth * INITIAL_PROPORTIONS.sectionsCombine.sectionOne
        );
        setSectionThreeWidth(
          newParentWidth * INITIAL_PROPORTIONS.sectionsCombine.sectionThree
        );
      } else if (showGoalSection) {
        setSectionOneWidth(newParentWidth * INITIAL_PROPORTIONS.sectionOne);
      } else if (showGraphSection) {
        setSectionThreeWidth(newParentWidth * INITIAL_PROPORTIONS.sectionThree);
      } else {
        setSectionOneWidth(newParentWidth * INITIAL_PROPORTIONS.sectionOne);
        setSectionThreeWidth(newParentWidth * INITIAL_PROPORTIONS.sectionThree);
      }
    }
  }, [paddingX, showGoalSection, showGraphSection]);

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
      <ErrorModal
        show={itemExist[1]}
        title="Drop Failed"
        message="The Goal already exists."
      />
      <ErrorModal
        show={groupItemsExist}
        title="Group Drop Failed"
        message="All selected Goals already exist."
        onHide={handleGroupDropModal}
      />
      {/* Goal List Section */}
      <Resizable
        handleClasses={{ right: "right-handler" }}
        enable={{ right: true }}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          display: showGoalSection ? "flex" : "none",
        }}
        size={{ width: sectionOneWidth, height: "100%" }}
        maxWidth={DEFINED_PROPORTIONS.maxWidth}
        minWidth={DEFINED_PROPORTIONS.minWidth}
        minHeight={DEFAULT_HEIGHT}
        onResize={handleResizeSectionOne}
      >
        {/* First Panel Content */}
        <GoalList
          ref={goalListRef}
          setDraggedItem={setDraggedItem}
          tabData={tabData}
          setTabData={setTabData}
          groupSelected={groupSelected}
          setGroupSelected={setGroupSelected}
        />
      </Resizable>

      <Button
        className="m-2 justify-content-center align-items-center"
        variant="primary"
        style={{ display: groupSelected.length > 0 ? "flex" : "none" }}
        onClick={handleDropGroupSelected}
      >
        {/* Click to Drop To Right Panel */}
        Drop
      </Button>

      {/* Cluster Hierachy Section */}
      <div
        style={{
          ...defaultStyle,
          width: "100%",
          minWidth: DEFINED_PROPORTIONS.minWidth,
          minHeight: DEFAULT_HEIGHT,
          height: "100%",
          padding: "10px",
          backgroundColor: "rgba(35, 144, 231, 0.1)",
        }}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        ref={sectionTwoRef}
      >
        <Tree
          treeData={treeData}
          itemExist={itemExist}
          setTreeData={setTreeData}
          setTabData={setTabData}
          setTreeIds={setTreeIds}
        />
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
          height: "100%",
        }}
        maxWidth={DEFINED_PROPORTIONS.maxWidth}
        minWidth={DEFINED_PROPORTIONS.minWidth}
        minHeight={DEFAULT_HEIGHT}
        onResize={handleResizeSectionThree}
      >
        {/* Third Panel Content */}
        Section 3
        <GraphRender xml={xmlData} />
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
