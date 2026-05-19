import {Resizable, ResizeCallback} from "re-resizable";
import React, {useEffect, useRef, useState} from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import ErrorModal from "./ErrorModal";
import GoalList from "./GoalList";
import Tree from "./Tree";
import {useFileContext} from "./context/FileProvider";
import UserStoriesPanel from "./UserStoriesPanel";
import {parseStoriesFromText, useUserStories} from "./context/UserStoriesContext";

import GraphWorker from "./Graphs/GraphWorker";
import {addGoalToTree, updateTextForGoalId} from "./context/treeDataSlice.ts";
import {isEmptyGoal} from "./utils/GoalHint.tsx";
import {TreeGoal, InstanceId} from "./types.ts";
import {extractModelForPrompt} from "./utils/modelExtractor";
import {buildUserStoryPrompt} from "./utils/promptBuilder";
import {generateUserStories} from "./utils/llmService";

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
  setShowGoalSection: (showGoalSection: boolean) => void;
  paddingX: number;
};

const SectionPanel: React.FC<SectionPanelProps> = ({
  showGoalSection,
  showGraphSection,
  setShowGoalSection,
  paddingX,
}) => {
  void setShowGoalSection;
  const [sectionOneWidth, setSectionOneWidth] = useState(0);
  const [sectionThreeWidth, setSectionThreeWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);

  const [draggedItem, setDraggedItem] = useState<TreeGoal | null>(null);
  // Simply store ids of all items in the tree for fast check instead of recursive search
    const {dispatch, tree, treeData} = useFileContext();
    const {state: usState, dispatch: usDispatch} = useUserStories();

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

  const handleGenerate = async () => {
    try {
      const extracted = extractModelForPrompt(treeData);
      const prompt = buildUserStoryPrompt(extracted);
      usDispatch({type: "SET_LOADING"});
      const raw = await generateUserStories(prompt);
      const stories = parseStoriesFromText(raw);
      usDispatch({type: "SET_SUCCESS", payload: {rawOutput: raw, stories}});
    } catch (err) {
      usDispatch({type: "SET_ERROR", payload: err instanceof Error ? err.message : "Unknown error"});
    }
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
            // the first hierachy does not contain the dragged item
            if (!tree.some((goal) => goal.id === draggedItem.id)) {
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
            // current hierachy
            (item) => !tree.some(
                goal => goal.id === item.id
            )
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
  const handleSynTableTree = (treeItem: TreeGoal, editedText: string) => {
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
  const isGenerating = usState.status === "loading";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: paddingX,
      }}
      ref={parentRef}
    >
      <div className="d-flex align-items-center">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              Generating...
            </>
          ) : (
            "✨ Generate User Stories"
          )}
        </Button>
      </div>

      {usState.status === "error" && (
        <Alert
          variant="danger"
          className="mt-2 mb-0 py-1 px-2"
          style={{fontSize: "0.85rem"}}
        >
          {usState.error}
        </Alert>
      )}

      <div style={{display: "flex", height: "100%", marginTop: "0.5rem"}}>
        <ErrorModal
          show={existingError}
          title="Drop Failed"
          message={`The selected ${(groupSelected.length > 1) ? "goals" : "goal"
          } already ${groupSelected.length > 1 ? "exist" : "exists"}.`}
          onHide={handleGroupDropModal}
        />

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
          <GoalList
            ref={goalListRef}
            setDraggedItem={setDraggedItem}
            groupSelected={groupSelected}
            setGroupSelected={setGroupSelected}
            handleSynTableTree={handleSynTableTree}
            handleDropGroupSelected={handleDropGroupSelected}
          />
        </Resizable>

        <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
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
              handleSynTableTree={handleSynTableTree}
              existingGoalReferenceInstanceId={existingGoalReferenceInstanceId}
              setExistingGoalReferenceInstanceId={setExistingGoalReferenceInstanceId}
            />
          </div>

          {usState.status !== "idle" && (
            <div style={{width: "100%", marginTop: "1rem", padding: "0 10px"}}>
              <UserStoriesPanel />
            </div>
          )}
        </div>

        <Resizable
          handleClasses={{left: "left-handler"}}
          enable={{left: true}}
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
          <GraphWorker showGraphSection={showGraphSection}/>
        </Resizable>
      </div>
    </div>
  );
};

export default SectionPanel;
