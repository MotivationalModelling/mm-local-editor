import React, { useEffect, useRef, useState } from "react";
import { Resizable, ResizeCallback } from "re-resizable";

import Button from "react-bootstrap/Button";

import ErrorModal from "./ErrorModal";
import GoalList from "./GoalList";
import Tree from "./Tree";
import { Label, TreeItem, useFileContext } from "./context/FileProvider";

import GraphRender from "./GraphRender";
import GraphWorker from "./Graphs/GraphWorker";
// use for testing xml validation only
const xmlData = `
  <root>
    <mxCell id="2" value="Hello," vertex="1">
      <mxGeometry x="20" y="20" width="80" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="World!" vertex="1">
      <mxGeometry x="200" y="150" width="80" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="" edge="1" source="2" target="3">
       <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
`;
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

type Goal = {
  GoalID: number;
  GoalType: string;
  GoalContent: string;
  SubGoals: Goal[];
};

type Cluster = {
  ClusterGoals: Goal[];
};


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
  const { treeData, setTreeData, tabData, setTabData } = useFileContext();
  const [treeIds, setTreeIds] = useState<number[]>([]);

  const [groupSelected, setGroupSelected] = useState<TreeItem[]>([]);

  const [existingItemIds, setExistingItemIds] = useState<number[]>([]);
  const [existingError, setExistingError] = useState<boolean>(false);

  // Stores user defined goals (treeData) into a structure used in GraphWorker. Initialise as empty
  const [cluster, setCluster] = useState<Cluster>({ ClusterGoals: []});

  // const [isHintVisible, setIsHintVisible] = useState(true);

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

  useEffect(() => {
    if (treeData.length) {
      const ids = getIds(treeData);
      setTreeIds(ids);
    }
  }, []);

  // Initialize the tree ids from the created/selected json file
  const getIds = (treeData: TreeItem[]) => {
    const ids: number[] = [];
    // Recursively get all the ids from the tree data
    const traverse = (arr: TreeItem[]) => {
      arr.forEach((item) => {
        ids.push(item.id);

        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(treeData);
    return ids;
  };

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
        const newData: TreeItem[] = [...treeData, draggedItem];
        setTreeData(newData);
        setTreeIds([...treeIds, draggedItem.id]);
        console.log("drop successful");
      } else {
        setExistingItemIds([...existingItemIds, draggedItem.id]);
        setExistingError(true);
        hideErrorModalTimeout();
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

    // If all items are in the tree, then show the warning
    if (newItemsToAdd.length === 0) {
      setExistingItemIds([...groupSelected.map((item) => item.id)]);
      setExistingError(true);
      hideErrorModalTimeout();
      return;
    }
    // Update treeData with new items, filter out the empty items
    const filteredTreeData = [
      ...treeData,
      ...newItemsToAdd.filter((item) => item.content.trim() !== ""),
    ];
    setTreeData(filteredTreeData);
    // Update Ids with new items, filter out the empjty items
    setTreeIds((prevIds) => [
      ...prevIds,
      ...newItemsToAdd
        .filter((item) => item.content.trim() !== "")
        .map((item) => item.id),
    ]);
    setGroupSelected([]);
  };

  const handleGroupDropModal = () => {
    setExistingItemIds([]);
    setExistingError(false);
    setGroupSelected([]);
  };

  // Update the tab data if exist while the tree data changed
  const updateTabDataContent = (label: Label, id: number, newText: string) => {
    const updatedTabData = tabData.map((tabContent) => {
      if (tabContent.label === label) {
        return {
          ...tabContent,
          rows: tabContent.rows.map((row) => {
            if (row.id === id) {
              return {
                ...row,
                content: newText,
              };
            }
            return row;
          }),
        };
      }
      return tabContent;
    });

    setTabData(updatedTabData);
  };

  // Update the tree recursively
  const updateItemTextInTree = (
    items: TreeItem[],
    idToUpdate: number,
    newText: string
  ): TreeItem[] => {
    if (!treeIds.includes(idToUpdate)) return items;

    return items.map((currentItem) => {
      if (currentItem.id === idToUpdate) {
        return { ...currentItem, content: newText }; // Update text of this item
      }
      if (currentItem.children) {
        currentItem.children = updateItemTextInTree(
          currentItem.children,
          idToUpdate,
          newText
        );
      }
      return currentItem;
    });
  };

  // Handle synchronize data in table data and tree data
  const handleSynTableTree = (treeItem: TreeItem, editedText: string) => {
    const updatedTreeData = updateItemTextInTree(
      treeData,
      treeItem.id,
      editedText
    );
    setTreeData(updatedTreeData);
    updateTabDataContent(treeItem.type, treeItem.id, editedText);
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

  // Mapping of old types to new types
  const typeMapping: Record<string, string> = {
    Who: "Stakeholder",
    Do: "Functional",
    Be: "Quality",
    Feel: "Emotional",
    Concern: "Negative",
  };

  // Function to convert TreeItem to Goal
  const convertTreeItemToGoal = (item: TreeItem): Goal => {
    console.log("Converting type: ", item.type, " to ", typeMapping[item.type]);
    return {
      GoalID: item.id,
      GoalType: typeMapping[item.type],
      GoalContent: item.content,
      SubGoals: item.children ? item.children.map(convertTreeItemToGoal) : [],
    };
  };
  

  // Convert the entire treeData into a cluster structure, to be sent to GraphWorker.
  const convertTreeDataToClusters = (treeData: TreeItem[]): Cluster => {
    return {
      ClusterGoals: treeData.map(convertTreeItemToGoal),
    };
  };


  useEffect(() => {
    setCluster((prevCluster) => {
      const newCluster = convertTreeDataToClusters(treeData);
      console.log("Cluster changed ", newCluster);
      return newCluster;
    });
  }, [treeData]);
 
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
          groupSelected.length > 1 ? "goals" : "goal"
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
          handleSynTableTree={handleSynTableTree}
          handleDropGroupSelected={handleDropGroupSelected}
        />
      </Resizable>

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
          existingItemIds={existingItemIds}
          setTreeIds={setTreeIds}
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
        Section 3
        <GraphWorker cluster={cluster}/>
        {/*  <GraphRender xml={xmlData} /> */}
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setShowGoalSection(!showGoalSection)}
          style={{ marginLeft: "20px" }}
        >
          {showGoalSection ? "Hide section 1" : "Show section 1"}
        </Button>
      </Resizable>
    </div>
  );
};

export default SectionPanel;
