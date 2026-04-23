import React, {useMemo, useRef, useState} from "react";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/esm/Form";
import {FaMinus, FaPlus} from "react-icons/fa";
import {BsFillTrash3Fill, BsGripVertical, BsXCircle} from "react-icons/bs";
import {SimpleTreeItemWrapper, SortableTree, TreeItemComponentProps, TreeItems,} from "dnd-kit-sortable-tree";
import {InstanceId, isNonFunctionalGoal, TreeGoal} from "./types.ts";
import {useFileContext} from "./context/FileProvider";
import ConfirmModal from "./ConfirmModal";
import {isTextEmpty} from "./utils/GoalHint.tsx";
import "./Tree.css";
import {deleteGoalReferenceFromHierarchy, setTreeData, updateTextForGoalId} from "./context/treeDataSlice.ts";
import IconForGoalType from "./IconForGoalType.tsx";

const INDENTATION_WIDTH = 24;

type SortableTreeGoal = TreeGoal & {
    collapsed?: boolean;
    canHaveChildren?: boolean;
};

type GoalReference = {
    goalId: TreeGoal["id"];
    instanceId: InstanceId;
};

type TreeProps = {
    existingGoalReferenceInstanceId: GoalReference[];
    setExistingGoalReferenceInstanceId: (existingGoalReferenceInstanceId: GoalReference[]) => void;
};

type TreeRowProps = TreeItemComponentProps<SortableTreeGoal> & {
    editingItemId: InstanceId | null;
    setEditingItemId: React.Dispatch<React.SetStateAction<InstanceId | null>>;
    existingGoalReferenceInstanceId: GoalReference[];
    onDeleteItem: (item: TreeGoal) => void;
};

const decorateTreeItems = (
    items: TreeGoal[],
    collapsedIds: Set<InstanceId>,
): TreeItems<SortableTreeGoal> => {
    return items.map((item) => ({
        ...item,
        collapsed: collapsedIds.has(item.instanceId),
        canHaveChildren: !isNonFunctionalGoal(item.type),
        children: decorateTreeItems(item.children ?? [], collapsedIds),
    }));
};

const stripTreeUiState = (items: TreeItems<SortableTreeGoal>): TreeGoal[] => {
    return items.map((treeItem) => {
        const {children, collapsed, canHaveChildren, ...plainItem} = treeItem;
        void collapsed;
        void canHaveChildren;

      return {
          ...plainItem,
          children: stripTreeUiState(children ?? []),
      };
    });
};

const collectCollapsedIds = (items: TreeItems<SortableTreeGoal>): Set<InstanceId> => {
    const collapsedIds = new Set<InstanceId>();

    const walk = (nodes: TreeItems<SortableTreeGoal>) => {
        nodes.forEach((node) => {
            if (node.collapsed) {
                collapsedIds.add(node.instanceId);
            }

            if (node.children?.length) {
               walk(node.children);
            }
        });
    };

    walk(items);
    return collapsedIds;
};

const getAllGoalInstances = (item: TreeGoal): GoalReference[] => {
    const result = [{goalId: item.id, instanceId: item.instanceId}];

    if (item.children) {
        item.children.forEach((child) => {
            result.push(...getAllGoalInstances(child));
        });
    }

    return result;
};

const TreeRow = React.forwardRef<HTMLDivElement, TreeRowProps>(({
    item,
    childCount,
    collapsed,
    clone,
    depth,
    disableSorting,
    handleProps,
    onCollapse,
    ghost,
    editingItemId,
    setEditingItemId,
    onDeleteItem,
    ...props
}, ref) => {
    const treeItem = item as SortableTreeGoal;
    const isEditing = (editingItemId === treeItem.instanceId);
    const iconSize = 16;
    const [editedText, setEditedText] = useState(treeItem.content);
    const {dispatch} = useFileContext();

    const keyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            dispatch(updateTextForGoalId({id: treeItem.id, text: editedText}));
            setEditingItemId(null);
        } else if (e.key === "Escape") {
            setEditingItemId(null);
        }
    };

    return (
        <SimpleTreeItemWrapper {...props}
                               ref={ref}
                               item={treeItem}
                               depth={depth}
                               clone={clone}
                               handleProps={handleProps}
                               disableSorting={disableSorting}
                               indentationWidth={INDENTATION_WIDTH}
                               childCount={childCount}
                               collapsed={collapsed}
                               onCollapse={onCollapse}
                               manualDrag
                               showDragHandle={false}
                               hideCollapseButton>
              <InputGroup>
                  <InputGroup.Text>
                      <BsGripVertical {...((!disableSorting) ? handleProps : {})}
                                      style={{cursor: disableSorting ? "default" : "grab"}}
                                      size={iconSize}/>
                  </InputGroup.Text>
                  {(childCount) ? (
                      <InputGroup.Text>
                          {(collapsed) ? <FaPlus size={iconSize}/> : <FaMinus size={iconSize}/>}
                      </InputGroup.Text>
                  ) : null}
                  <InputGroup.Text>
                      <IconForGoalType type={treeItem.type}/>
                  </InputGroup.Text>
                  {(isEditing) ? (
                      <Form.Control placeholder="Goal name"
                                    defaultValue={treeItem.content}
                                    onKeyDown={keyDown}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    isInvalid={isTextEmpty(editedText) /* || isGoalDuplicatedAtThisLevel(editedText) */}/>
                  ) : (
                      <Form.Control placeholder="Goal name"
                                    value={treeItem.content}
                                    onClick={() => setEditingItemId(treeItem.instanceId)}
                                    readOnly/>
                  )}
                  <InputGroup.Text>
                      {(isEditing) ? (
                          <BsXCircle size={iconSize}
                                     onClick={() => setEditingItemId(null)}/>
                      ) : (
                          <BsFillTrash3Fill size={iconSize}
                                            onClick={() => onDeleteItem(treeItem)}/>
                      )}
                  </InputGroup.Text>
              </InputGroup>
      </SimpleTreeItemWrapper>
    );
});

TreeRow.displayName = "TreeRow";

const Tree: React.FC<TreeProps> = ({
    existingGoalReferenceInstanceId,
    setExistingGoalReferenceInstanceId,
}) => {
    const [editingItemId, setEditingItemId] = useState<InstanceId | null>(null);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [collapsedIds, setCollapsedIds] = useState<Set<InstanceId>>(new Set());
    const deletingItemRef = useRef<TreeGoal | null>(null);
    const {treeData, dispatch} = useFileContext();

    const sortableItems = useMemo(
      () => decorateTreeItems(treeData, collapsedIds),
      [treeData, collapsedIds],
    );

    const deleteItem = () => {
      if (deletingItemRef.current) {
        dispatch(deleteGoalReferenceFromHierarchy(deletingItemRef.current));
      }

      setExistingGoalReferenceInstanceId([]);
      setShowDeleteWarning(false);
    };

    const handleDeleteItem = (item: TreeGoal) => {
      deletingItemRef.current = item;

      const deletingGoalReferences = getAllGoalInstances(item);
      if (item.children && item.children.length > 0) {
        setExistingGoalReferenceInstanceId([
          ...existingGoalReferenceInstanceId,
          ...deletingGoalReferences,
        ]);
        setShowDeleteWarning(true);
        return;
      }

      deleteItem();
    };

    const handleDeleteCancel = () => {
      setShowDeleteWarning(false);
      setExistingGoalReferenceInstanceId([]);
    };

    const handleItemsChanged = (items: TreeItems<SortableTreeGoal>) => {
      setCollapsedIds(collectCollapsedIds(items));
      dispatch(setTreeData(stripTreeUiState(items)));
    };

    const DndTreeItem = React.forwardRef<HTMLDivElement, TreeItemComponentProps<SortableTreeGoal>>((props, ref) => (
        <TreeRow {...props}
                 ref={ref}
                 editingItemId={editingItemId}
                 setEditingItemId={setEditingItemId}
                 existingGoalReferenceInstanceId={existingGoalReferenceInstanceId}
                 onDeleteItem={handleDeleteItem}/>
    ));

    DndTreeItem.displayName = "DndTreeItem";

    return (
        <div style={{width: "100%", height: "100%", alignSelf: "flex-start", position: "relative"}}>
            <ConfirmModal show={showDeleteWarning}
                          title="Delete Warning"
                          message="You are going to delete a goal with children goals, are you sure?"
                          onHide={handleDeleteCancel}
                          onConfirm={deleteItem}/>

            <SortableTree items={sortableItems}
                          onItemsChanged={handleItemsChanged}
                          TreeItemComponent={DndTreeItem}
                          indentationWidth={INDENTATION_WIDTH}
                          disableSorting={editingItemId !== null}
                          pointerSensorOptions={{
                              activationConstraint: {
                                  distance: 5
                              }
                          }}/>
        </div>
    );
};

export default Tree;
