import {Resizable, ResizeCallback} from "re-resizable";
import React, {useEffect, useRef, useState} from "react";

import ErrorModal from "./ErrorModal";
import GoalList from "./GoalList";
import Tree from "./Tree";
import {useFileContext} from "./context/FileProvider";

import GraphWorker from "./Graphs/GraphWorker";
import {addGoalToTree, updateTextForGoalId} from "./context/treeDataSlice.ts";
import {isEmptyGoal} from "./utils/GoalHint.tsx";
import {TreeGoal, InstanceId} from "./types.ts";
import FeedbackPanel from "./Feedback/FeedbackPanel";
import {useGraph} from "./context/GraphContext";

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



type SectionPanelProps = {
  showGoalSection: boolean;
  showGraphSection: boolean;
  showFeedbackSection: boolean;
  onCloseFeedback: () => void;
  paddingX: number;
};

const SectionPanel: React.FC<SectionPanelProps> = ({
  showGoalSection,
  showGraphSection,
  showFeedbackSection,
  onCloseFeedback,
  paddingX,
}) => {
  const {graph} = useGraph();
  const [sectionOneWidth, setSectionOneWidth] = useState(0);
  const [sectionThreeWidth, setSectionThreeWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);

  // Use the flat instance index to check all hierarchy levels without recursive search.
  const {dispatch, treeIds} = useFileContext();

  const [groupSelected, setGroupSelected] = useState<TreeGoal[]>([]);

  const [existingItemIds, setExistingItemIds] = useState<number[]>([]);
    const [existingGoalReferenceInstanceId, setExistingGoalReferenceInstanceId] = useState<{goalId: TreeGoal["id"]; instanceId: InstanceId}[]>([])
  const [existingError, setExistingError] = useState<boolean>(false);

  // const [isHintVisible, setIsHintVisible] = useState(true);

  const sectionTwoRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const goalListRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle section one resize and section three auto resize
  const handleResizeSectionOne: ResizeCallback = (_event, _direction, ref) => {
    setSectionOneWidth(ref.offsetWidth);
        if (sectionTwoRef.current) {
            const totalWidth =
                ref.offsetWidth + sectionTwoRef.current.offsetWidth + sectionThreeWidth;

            if (totalWidth >= parentWidth) {
      setSectionThreeWidth(
        parentWidth - ref.offsetWidth - sectionTwoRef.current.offsetWidth
      );
    }
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

  // Add selected items where they are not in the tree to the tree and reset selected items, uncheck the checkboxes
  const handleDropGroupSelected = () => {
    // Filter out goals that already have an instance at any hierarchy level.
    const newItemsToAdd = groupSelected.filter(
      (item) => !treeIds[item.id]?.length
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

  // Get the parent div inner width and set starter width for section one and section three
  useEffect(() => {
    if (parentRef.current) {
      const newParentWidth = parentRef.current.clientWidth - paddingX * 2;
      const feedbackWidth = showFeedbackSection ? Math.min(340, Math.max(280, window.innerWidth * 0.2)) : 0;
      const availableWidth = newParentWidth - feedbackWidth;
      setParentWidth(availableWidth);

      if (showGoalSection && showGraphSection) {
        setSectionOneWidth(
          availableWidth * INITIAL_PROPORTIONS.sectionsCombine.sectionOne
        );
        setSectionThreeWidth(
          availableWidth * INITIAL_PROPORTIONS.sectionsCombine.sectionThree
        );
      } 
      else if (showGoalSection) {
        setSectionOneWidth(availableWidth * INITIAL_PROPORTIONS.sectionOne);
      } 
      else if (showGraphSection) {
        setSectionThreeWidth(availableWidth);
      } 
      else {
        setSectionOneWidth(availableWidth * INITIAL_PROPORTIONS.sectionOne);
        setSectionThreeWidth(availableWidth * INITIAL_PROPORTIONS.sectionThree);
      }
    }
  }, [paddingX, showGoalSection, showGraphSection, showFeedbackSection]);

  const graphOnly = showGraphSection && !showGoalSection;

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
        message={`The selected ${(existingItemIds.length > 1) ? "goals" : "goal"
        } already ${existingItemIds.length > 1 ? "exist" : "exists"}.`}
        onHide={handleGroupDropModal}
      />
      {/* <DragHint isHintVisible={isHintVisible} width={sectionOneWidth-paddingX*2} height={4}/> */}

      {/* Goal List Section */}
      <Resizable
        handleClasses={{right: "right-handler"}}
        enable={{right: true}}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          display: showGoalSection ? "flex" : "none",
        }}
        size={{width: sectionOneWidth, height: "100%"}}
        maxWidth={DEFINED_PROPORTIONS.maxWidth}
        minWidth={DEFINED_PROPORTIONS.minWidth}
        minHeight={DEFAULT_HEIGHT}
        onResize={handleResizeSectionOne}
      >
        {/* First Panel Content */}
        <GoalList
          ref={goalListRef}
          groupSelected={groupSelected} 
          setGroupSelected={setGroupSelected}
          handleSynTableTree={(treeItem: TreeGoal, text: string) => dispatch(updateTextForGoalId({id: treeItem.id, text}))}
          handleDropGroupSelected={handleDropGroupSelected}
        />
      </Resizable>

      {/* Cluster Hierarchy Section */}
      <div
        style={{
          // ...defaultStyle,
          width: "100%",
          minWidth: DEFINED_PROPORTIONS.minWidth,
          minHeight: DEFAULT_HEIGHT,
          height: DEFAULT_HEIGHT,
          padding: "10px",
          backgroundColor: "rgba(35, 144, 231, 0.1)",
          overflow: "auto",
          display: showGoalSection ? "block" : "none",
        }}
        ref={sectionTwoRef}
      >
          <Tree existingGoalReferenceInstanceId={existingGoalReferenceInstanceId}
                setExistingGoalReferenceInstanceId={setExistingGoalReferenceInstanceId}
                onGoalsDropped={(existingGoalIds) => {
                  setGroupSelected([]);
                  if (existingGoalIds.length > 0) {
                    setExistingItemIds(existingGoalIds);
                    setExistingError(true);
                    hideErrorModalTimeout();
                  }
                }}/>
      </div>

      {/* Graph Render Section */}
      <Resizable
        handleClasses={{left: "left-handler"}}
        enable={{left: !graphOnly}}
        className={graphOnly ? "feedback-graph-fill" : undefined}
        style={{
          ...defaultStyle,
          backgroundColor: "rgb(236, 244, 244)",
          display: showGraphSection ? "flex" : "none",
        }}
        size={{
          width: graphOnly ? "auto" : sectionThreeWidth,
          height: "100%",
        }}
        maxWidth={graphOnly ? "100%" : DEFINED_PROPORTIONS.maxWidth}
        minWidth={DEFINED_PROPORTIONS.minWidth}
        minHeight={DEFAULT_HEIGHT}
        onResize={handleResizeSectionThree}
      >
        {/* Third Panel Content */}
        <GraphWorker showGraphSection={showGraphSection}/>
      </Resizable>
      {showFeedbackSection && (
        <section className="feedback-panel-column" aria-label="Feedback panel">
          <FeedbackPanel onClose={onCloseFeedback} onSelectNode={(nodeId) => {
            const cell = graph?.getDataModel().getCell(nodeId);
            if (!graph || !cell) return;
            graph.setSelectionCell(cell);
            graph.scrollCellToVisible(cell, true);
          }}/>
        </section>
      )}
    </div>
  );
};

export default SectionPanel;
