import React, {useMemo, useRef, useState} from "react";
import WhoIcon from "/img/Stakeholder.png";
import DoIcon from "/img/Function.png";
import BeIcon from "/img/Cloud.png";
import FeelIcon from "/img/Heart.png";
import ConcernIcon from "/img/Risk.png";
import {FaPlus, FaMinus} from "react-icons/fa";
import {
    SimpleTreeItemWrapper,
    SortableTree,
    TreeItemComponentProps,
    TreeItems,
} from "dnd-kit-sortable-tree";
import {BsCheckCircle, BsFillTrash3Fill, BsGripVertical, BsPencilSquare, BsXCircle} from "react-icons/bs";
import {InstanceId, Label, TreeGoal, isNonFunctionalGoal} from "../components/types.ts";
import {useFileContext} from "./context/FileProvider";
import ConfirmModal from "./ConfirmModal";
import ErrorModal from "./ErrorModal";
import {
    handleContentSave,
    handleGoalBlur,
    handleGoalKeyPress,
    isEmptyGoal,
    isTextEmpty,
} from "./utils/GoalHint.tsx";
import "./Tree.css";
import {
    deleteGoalReferenceFromHierarchy,
    hierarchyHasDuplicateGoalIdsAtSameLevel,
    setTreeData,
} from "./context/treeDataSlice.ts";

const INDENTATION_WIDTH = 24;

const treeListStyle: React.CSSProperties = {
    position: "relative",
    background: "white",
    display: "flex",
    border: "1px solid gray",
    borderRadius: "5px",
    alignItems: "center",
    padding: "0.1rem",
    minWidth: "100px",
    width: "100%",
};

const treeInputStyle: React.CSSProperties = {
    backgroundColor: "#e0e0e0",
    border: "none",
    margin: 0,
    padding: 0,
    flex: 1,
    outline: "none",
    width: "100%",
    height: "100%",
};

type SortableTreeGoal = Omit<TreeGoal, "id" | "children"> & {
    goalId: TreeGoal["id"];
    collapsed?: boolean;
    canHaveChildren?: boolean;
};

type SortableTreeItem = TreeItems<SortableTreeGoal>[number];

type GoalReference = {
    goalId: TreeGoal["id"];
    instanceId: InstanceId;
};

type TreeProps = {
    handleSynTableTree: (treeItem: TreeGoal, editedText: string) => void;
    existingGoalReferenceInstanceId: GoalReference[];
    setExistingGoalReferenceInstanceId: (existingGoalReferenceInstanceId: GoalReference[]) => void;
};

type TreeRowProps = TreeItemComponentProps<SortableTreeGoal> & {
    editingItemId: InstanceId | null;
    editedText: string;
    inputRef: React.RefObject<HTMLInputElement>;
    disableOnBlur: boolean;
    setDisableOnBlur: React.Dispatch<React.SetStateAction<boolean>>;
    setEditingItemId: React.Dispatch<React.SetStateAction<InstanceId | null>>;
    setEditedText: React.Dispatch<React.SetStateAction<string>>;
    handleSynTableTree: (treeItem: TreeGoal, editedText: string) => void;
    existingGoalReferenceInstanceId: GoalReference[];
    onDeleteItem: (item: TreeGoal) => void;
};

const iconFromType = (type: Label) => {
    const typeToIcon = {
      Be: BeIcon,
      Do: DoIcon,
      Concern: ConcernIcon,
      Feel: FeelIcon,
      Who: WhoIcon,
    };

    if (type in typeToIcon) {
      return typeToIcon[type];
    }

    throw Error(`iconFromType: Unknown type "${type}"`);
};

const IconComponent = ({type}: {type: Label}) => (
    <img
        src={iconFromType(type)}
        alt={`${type} icon`}
        className="ms-2 me-1"
        style={{
          height: type === "Who" ? "30px" : "20px",
        }}
    />
);

export const decorateTreeItems = (
    items: TreeGoal[],
    collapsedIds: Set<InstanceId>,
): TreeItems<SortableTreeGoal> => {
    return items.map((item) => ({
        ...item,
        goalId: item.id,
        id: item.instanceId,
        collapsed: collapsedIds.has(item.instanceId),
        canHaveChildren: !isNonFunctionalGoal(item.type),
        children: decorateTreeItems(item.children ?? [], collapsedIds),
    }));
};

export const stripTreeUiState = (items: TreeItems<SortableTreeGoal>): TreeGoal[] => {
    return items.map((treeItem) => {
        const {children, collapsed, canHaveChildren, goalId, id, ...plainItem} = treeItem;
        void collapsed;
        void canHaveChildren;
        void id;

      return {
          ...plainItem,
          id: goalId,
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
    editedText,
    inputRef,
    disableOnBlur,
    setDisableOnBlur,
    setEditingItemId,
    setEditedText,
    handleSynTableTree,
    existingGoalReferenceInstanceId,
    onDeleteItem,
    ...props
}, ref) => {
    const treeItem = item as SortableTreeItem;
    const goalItem: TreeGoal = {
        id: treeItem.goalId,
        instanceId: treeItem.instanceId,
        content: treeItem.content,
        type: treeItem.type,
        color: treeItem.color,
        x: treeItem.x,
        y: treeItem.y,
        children: stripTreeUiState(treeItem.children ?? []),
    };
    const isEditing = editingItemId === treeItem.instanceId;
    const iconSize = 25;
    const isReference = existingGoalReferenceInstanceId.some(
      (itemRef) => itemRef.goalId === treeItem.goalId && itemRef.instanceId === treeItem.instanceId
    );

    const handleEdit = () => {
        if (isEmptyGoal(goalItem)) {
          return;
        }

        setEditingItemId(treeItem.instanceId);
        setEditedText(treeItem.content);

        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
    };

    const handleCancel = () => {
        setEditingItemId(null);
        setEditedText(treeItem.content);

        requestAnimationFrame(() => {
          setDisableOnBlur(false);
        });
    };

    const handleSave = () => {
        handleContentSave(
            treeItem.content,
            editedText,
            (content) => {
              handleSynTableTree(goalItem, content);
              setEditingItemId(null);
            },
            handleCancel,
        );
    };

    const handleBlur = () => {
        handleGoalBlur(
          treeItem.content,
          editedText,
          (content) => {
            handleSynTableTree(goalItem, content);
            setEditingItemId(null);
          },
          handleCancel,
          disableOnBlur,
        );
        setDisableOnBlur(false);
    };

    const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        handleGoalKeyPress(
          event,
          treeItem.content,
          editedText,
          (content) => {
            handleSynTableTree(goalItem, content);
            setEditingItemId(null);
          },
          handleCancel,
        );
    };

    return (
        <SimpleTreeItemWrapper
          {...props}
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
          hideCollapseButton
        >
        <div
          style={{
            ...treeListStyle,
            backgroundColor: isEditing
              ? "#e0e0e0"
              : isReference
                ? "#FF474C"
                : "white",
            boxShadow: clone ? "0 8px 24px rgba(0, 0, 0, 0.18)" : undefined,
            opacity: ghost ? 0.55 : 1,
          }}
          className="tree-list"
          onDoubleClick={() => {
            if (!isEditing && !isEmptyGoal(goalItem)) {
              handleEdit();
            }
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: "0.35rem",
              gap: "0.2rem",
              cursor: disableSorting ? "default" : "grab",
            }}
          >
            <div
              style={{
                width: "16px",
                display: "flex",
                justifyContent: "center",
                cursor: childCount ? "pointer" : "default",
              }}
              onClick={(event) => {
                event.stopPropagation();
                onCollapse?.();
              }}
            >
              {childCount ? (
                collapsed ? <FaPlus size={13} /> : <FaMinus size={13} />
              ) : null}
            </div>
            <div
              {...(!disableSorting ? handleProps : {})}
              style={{
                display: "flex",
                alignItems: "center",
                color: "#666",
                cursor: disableSorting ? "default" : "grab",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <BsGripVertical size={16} />
            </div>
          </div>

          <IconComponent type={treeItem.type} />

          <div
            style={{
              padding: ".5rem",
              flex: 1,
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedText}
                onChange={(event) => setEditedText(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleEditKeyDown}
                className={`tree-input ${isTextEmpty(editedText) ? "is-invalid" : ""}`}
                style={treeInputStyle}
              />
            ) : (
              treeItem.content
            )}
          </div>

          {isEditing && isTextEmpty(editedText) && (
            <div className="invalid-feedback d-block small">
              Content cannot be empty
            </div>
          )}

          <div
            className="edit-icon"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (isEditing) {
                handleSave();
              } else {
                handleEdit();
              }
            }}
            style={{
              opacity: !isEditing && isEmptyGoal(goalItem) ? 0.5 : 1,
              cursor: !isEditing && isEmptyGoal(goalItem) ? "not-allowed" : "pointer",
            }}
          >
            {isEditing ? (
              <BsCheckCircle size={iconSize} />
            ) : (
              <BsPencilSquare size={iconSize} />
            )}
          </div>

          <div
            className="delete-icon"
            onMouseDown={(event) => {
              setDisableOnBlur(true);
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (isEditing) {
                handleCancel();
              } else {
                onDeleteItem(goalItem);
              }
            }}
          >
            {isEditing ? (
              <BsXCircle size={iconSize} />
            ) : (
              <BsFillTrash3Fill size={iconSize} />
            )}
          </div>
        </div>
      </SimpleTreeItemWrapper>
    );
});

TreeRow.displayName = "TreeRow";

const Tree: React.FC<TreeProps> = ({
    handleSynTableTree,
    existingGoalReferenceInstanceId,
    setExistingGoalReferenceInstanceId,
}) => {
    const [editingItemId, setEditingItemId] = useState<InstanceId | null>(null);
    const [editedText, setEditedText] = useState("");
    const [disableOnBlur, setDisableOnBlur] = useState(false);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [showDuplicateLevelWarning, setShowDuplicateLevelWarning] = useState(false);
    const [collapsedIds, setCollapsedIds] = useState<Set<InstanceId>>(new Set());
    const deletingItemRef = useRef<TreeGoal | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
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
      const nextTree = stripTreeUiState(items);
      if (hierarchyHasDuplicateGoalIdsAtSameLevel(nextTree)) {
        setShowDuplicateLevelWarning(true);
        return;
      }

      setCollapsedIds(collectCollapsedIds(items));
      dispatch(setTreeData(nextTree));
    };

    const DndTreeItem = React.forwardRef<HTMLDivElement, TreeItemComponentProps<SortableTreeGoal>>((props, ref) => (
        <TreeRow
          {...props}
          ref={ref}
          editingItemId={editingItemId}
          editedText={editedText}
          inputRef={inputRef}
          disableOnBlur={disableOnBlur}
          setDisableOnBlur={setDisableOnBlur}
          setEditingItemId={setEditingItemId}
          setEditedText={setEditedText}
          handleSynTableTree={handleSynTableTree}
          existingGoalReferenceInstanceId={existingGoalReferenceInstanceId}
          onDeleteItem={handleDeleteItem}
        />
    ));

    DndTreeItem.displayName = "DndTreeItem";

    return (
        <div style={{width: "100%", height: "100%", alignSelf: "flex-start", position: "relative"}}>
          <ConfirmModal
            show={showDeleteWarning}
            title="Delete Warning"
            message="You are going to delete a goal with children goals, are you sure?"
            onHide={handleDeleteCancel}
            onConfirm={deleteItem}
          />
          <ErrorModal
            show={showDuplicateLevelWarning}
            title="Move Failed"
            message="The same goal cannot appear more than once at the same hierarchy level."
            onHide={() => setShowDuplicateLevelWarning(false)}
          />

          <SortableTree
            items={sortableItems}
            onItemsChanged={handleItemsChanged}
            TreeItemComponent={DndTreeItem}
            indentationWidth={INDENTATION_WIDTH}
            disableSorting={editingItemId !== null}
            pointerSensorOptions={{
              activationConstraint: {
                distance: 5,
              },
            }}
          />
        </div>
    );
};

export default Tree;
