import React, {useEffect, useRef, useState} from "react";
import {Resizable, ResizeCallback} from "re-resizable";

import ErrorModal from "./ErrorModal";
import GoalList from "./GoalList";
import Tree from "./Tree";
import {TreeItem, useFileContext} from "./context/FileProvider";

import GraphWorker from "./Graphs/GraphWorker";
import {addGoalToTree, updateTextForGoalId} from "./context/treeDataSlice.ts";
import {isEmptyGoal} from "./utils/GoalHint.tsx";

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
  sectionThree: 0.63,
  sectionsCombine: {
    sectionOne: 0.2,
    sectionThree: 0.5,
  },
};

const DEFAULT_HEIGHT = "800px";

// Predefined constant cluster to use for the example graph
const defaultTreeData: TreeItem[] = [
  {
    id: 1,
    content: "Functional Goal",
    type: "Do",
    children: [
      {
        id: 6,
        content: "Functional Goal 2",
        type: "Do",
        children: [
          {
            id: 7,
            content: "Functional Goal 3",
            type: "Do",
            children: []
          }
        ]
      },
      {
        id: 8,
        content: "Functional Goal 4",
        type: "Do",
        children: []
      }
    ]
  },
  {
    id: 2,
    content: "Quality Goals",
    type: "Be",
    children: []
  },
  {
    id: 3,
    content: "Emotional Goals",
    type: "Feel",
    children: []
  },
  {
    id: 4,
    content: "Stakeholders",
    type: "Who",
    children: []
  },
  {
    id: 5,
    content: "Negatives",
    type: "Concern",
    children: []
  }
];


//const defaultTreeIds: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

type SectionPanelProps = {
  showGoalSection: boolean;
  showGraphSection: boolean;
  setShowGoalSection: (showGoalSection: boolean) => void;
  paddingX: number;
};

const SectionPanel: React.FC<SectionPanelProps> = ({
  showGoalSection,
  showGraphSection,
  setShowGoalSection,
  paddingX,
}) => {
  const [sectionOneWidth, setSectionOneWidth] = useState(0);
  const [sectionThreeWidth, setSectionThreeWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);

  const [draggedItem, setDraggedItem] = useState<TreeItem | null>(null);
  // Simply store ids of all items in the tree for fast check instead of recursive search
  const {dispatch, treeIds} = useFileContext();

  const [groupSelected, setGroupSelected] = useState<TreeItem[]>([]);

  const [existingItemIds, setExistingItemIds] = useState<number[]>([]);
  const [existingError, setExistingError] = useState<boolean>(false);

  // const [isHintVisible, setIsHintVisible] = useState(true);

  const sectionTwoRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const goalListRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // If the width sum exceeds the parent total width, auto resize the section one until reach the minimum
    if (
      sectionTwoRef.current &&
      sectionOneWidth + sectionTwoRef.current.offsetWidth + ref.offsetWidth >=
        parentWidth
    ) {
      setSectionOneWidth(
        parentWidth - ref.offsetWidth - sectionTwoRef.current.offsetWidth
      );
    }
    console.log(sectionOneWidth);
  };

  // Hide the drop error modal automatically after a set time
  const hideErrorModalTimeout = () => {
    const delayTime = 1500;

    // Clear previous timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setExistingItemIds([]);
      setGroupSelected([]);
      setExistingError(false);
    }, delayTime);
  };

  // Handle for goals drop on the nestable section
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      // Temporary Group drop
      if (groupSelected.length > 1) {
          handleDropGroupSelected();
          return;
      }

      if (draggedItem && draggedItem.content) {
          if (!treeIds.includes(draggedItem.id)) {
              dispatch(addGoalToTree(draggedItem));
          } else {
              setExistingItemIds([...existingItemIds, draggedItem.id]);
              setExistingError(true);
              hideErrorModalTimeout();

          }
      }
  };

  // Add selected items where they are not in the tree to the tree and reset selected items, uncheck the checkboxes
  const handleDropGroupSelected = () => {
    
    // Filter groupSelected to get only objects whose IDs are not in treeData
    const newItemsToAdd = groupSelected.filter(
      (item) => !treeIds.includes(item.id)
    );

    // If all items are in the tree, then show the warning
    if (newItemsToAdd.length === 0) {
      setExistingItemIds([...groupSelected.map((item) => item.id)]);
      setExistingError(true);
      hideErrorModalTimeout();
     
      return;
    }

     // Update treeData with new items, filter out the empty items
    const filteredNewItems = newItemsToAdd.filter((item) => !isEmptyGoal(item));
    filteredNewItems.forEach(item => {
      dispatch(addGoalToTree(item)); // Add each item individually
    });

    setGroupSelected([]);
  };

  const handleGroupDropModal = () => {
    setExistingItemIds([]);
    setExistingError(false);
    setGroupSelected([]);
  };

  // Handle synchronize data in table data and tree data
  const handleSynTableTree = (treeItem: TreeItem, editedText: string) => {
    dispatch(updateTextForGoalId({id: treeItem.id, text: editedText}));
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
      } 
      else if (showGoalSection) {
        setSectionOneWidth(newParentWidth * INITIAL_PROPORTIONS.sectionOne);
      } 
      else if (showGraphSection) {
        setSectionThreeWidth(newParentWidth * INITIAL_PROPORTIONS.sectionThree);
      } 
      else {
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
      // onClick={() => setIsHintVisible(false)}
    >
      {/* Additional helper components */}
      <ErrorModal
        show={existingError}
        title="Drop Failed"
        message={`The selected ${
          (groupSelected.length > 1) ? "goals" : "goal"
        } already ${groupSelected.length > 1 ? "exist" : "exists"}.`}
        onHide={handleGroupDropModal}
      />
      {/* <DragHint isHintVisible={isHintVisible} width={sectionOneWidth-paddingX*2} height={4}/> */}

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
          groupSelected={groupSelected} 
          setGroupSelected={setGroupSelected}
          handleSynTableTree={(treeItem: TreeItem, text: string) => dispatch(updateTextForGoalId({id: treeItem.id, text: text}))}
          handleDropGroupSelected={handleDropGroupSelected}
        />
      </Resizable>

      {/* Cluster Hierarchy Section */}
      <div
        style={{
          ...defaultStyle,
          width: "100%",
          minWidth: DEFINED_PROPORTIONS.minWidth,
          minHeight: DEFAULT_HEIGHT,
          height: DEFAULT_HEIGHT,
          padding: "10px",
          backgroundColor: "rgba(35, 144, 231, 0.1)",
          overflow: "auto",
        }}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        ref={sectionTwoRef}
      >
        <Tree
          existingItemIds={existingItemIds}
          // setTreeIds={setTreeIds}
          handleSynTableTree={handleSynTableTree}
          setExistingItemIds={setExistingItemIds}
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
        
        <GraphWorker showGraphSection={showGraphSection}/>
      </Resizable>
    </div>
  );
};

export default SectionPanel;
