import React, {useEffect, useRef, useState} from "react";
import {Resizable} from "re-resizable";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import {BsArrowLeftRight} from "react-icons/bs";

import ErrorModal from "./ErrorModal";
import GoalList from "./GoalList";
import Tree from "./Tree";
import {useFileContext} from "./context/FileProvider";
import UserStoriesPanel from "./UserStoriesPanel";
import GraphWorker from "./Graphs/GraphWorker";
import {addGoalToTree, updateTextForGoalId} from "./context/treeDataSlice.ts";
import {isEmptyGoal} from "./utils/GoalHint.tsx";
import {TreeGoal, InstanceId} from "./types.ts";
import "./SectionPanel.css";

export type ProjectEditTab = "goal" | "model" | "stories";

type SectionPanelProps = {
  activeTab: ProjectEditTab;
  onTabChange: (tab: ProjectEditTab) => void;
};

const SectionPanel: React.FC<SectionPanelProps> = ({activeTab, onTabChange}) => {
  const [hierarchyWidthPercent, setHierarchyWidthPercent] = useState(50);
  const [isSwapped, setIsSwapped] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const {dispatch, tree} = useFileContext();
  const [groupSelected, setGroupSelected] = useState<TreeGoal[]>([]);
  const [existingItemIds, setExistingItemIds] = useState<number[]>([]);
  const [existingGoalReferenceInstanceId, setExistingGoalReferenceInstanceId] = useState<{goalId: TreeGoal["id"]; instanceId: InstanceId}[]>([]);
  const [existingError, setExistingError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  }, []);

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

  return (
    <div className="section-panel">
      <ErrorModal
        show={existingError}
        title="Drop Failed"
        message={`The selected ${existingItemIds.length > 1 ? "goals" : "goal"} already ${existingItemIds.length > 1 ? "exist" : "exists"}.`}
        onHide={handleGroupDropModal}
      />

      <div
        className={`section-panel__columns${isSwapped ? " section-panel__columns--swapped" : ""}`}
        ref={columnsRef}
        onDragStartCapture={() => setIsDragging(true)}
        onDragEndCapture={() => setIsDragging(false)}
        onDropCapture={() => setIsDragging(false)}
      >
        <Resizable
          className="section-panel__resizable"
          size={{width: `${hierarchyWidthPercent}%`, height: "100%"}}
          minWidth="10%"
          maxWidth="80%"
          enable={{right: !isSwapped, left: isSwapped}}
          handleClasses={{right: "section-panel__resize-handle", left: "section-panel__resize-handle"}}
          handleStyles={{
            right: {top: 48, height: "calc(100% - 48px)"},
            left: {top: 48, height: "calc(100% - 48px)"},
          }}
          onResizeStart={() => setIsResizing(true)}
          onResizeStop={(_event, _direction, element) => {
            setIsResizing(false);
            const availableWidth = columnsRef.current?.clientWidth ?? 0;
            if (availableWidth > 0) {
              setHierarchyWidthPercent(element.offsetWidth / availableWidth * 100);
            }
          }}
        >
          <button
            type="button"
            className="section-panel__swap-button"
            aria-label="Swap hierarchy and project details"
            aria-pressed={isSwapped}
            title={isSwapped ? "Move hierarchy to the left" : "Move hierarchy to the right"}
            disabled={isResizing || isDragging}
            onClick={() => setIsSwapped((swapped) => !swapped)}
          >
            <BsArrowLeftRight aria-hidden="true"/>
          </button>
          <section className="section-panel__hierarchy" aria-labelledby="hierarchy-heading">
            <h2 id="hierarchy-heading" className="section-panel__heading">Hierarchy</h2>
            <div className="section-panel__tree">
              <Tree
                existingGoalReferenceInstanceId={existingGoalReferenceInstanceId}
                setExistingGoalReferenceInstanceId={setExistingGoalReferenceInstanceId}
                onGoalsDropped={(existingGoalIds) => {
                  setGroupSelected([]);
                  if (existingGoalIds.length > 0) {
                    setExistingItemIds(existingGoalIds);
                    setExistingError(true);
                    hideErrorModalTimeout();
                  }
                }}
              />
            </div>
          </section>
        </Resizable>

        <section className="section-panel__workspace" aria-label="Project details">
          <Tab.Container
            id="project-details"
            activeKey={activeTab}
            onSelect={(key) => {
              if (key === "goal" || key === "model" || key === "stories") onTabChange(key);
            }}
            transition={false}
            mountOnEnter={false}
            unmountOnExit={false}
          >
            <Nav className="section-panel__tabs" aria-label="Project views">
              <Nav.Item><Nav.Link eventKey="goal">Goal</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="model">Model</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="stories">User stories</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content className="section-panel__content">
              <Tab.Pane eventKey="goal" className="section-panel__pane section-panel__goal">
                <GoalList
                  groupSelected={groupSelected}
                  setGroupSelected={setGroupSelected}
                  handleSynTableTree={(treeItem, text) => dispatch(updateTextForGoalId({id: treeItem.id, text}))}
                  handleDropGroupSelected={handleDropGroupSelected}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="model" className="section-panel__pane section-panel__model">
                <GraphWorker showGraphSection={activeTab === "model"}/>
              </Tab.Pane>
              <Tab.Pane eventKey="stories" className="section-panel__pane section-panel__stories">
                <UserStoriesPanel/>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </section>
      </div>
    </div>
  );
};

export default SectionPanel;
