import React, {useMemo, useRef, useState} from "react";
import {SortableTree, TreeItemComponentProps, TreeItems,} from "dnd-kit-sortable-tree";
import {InstanceId, isNonFunctionalGoal, TreeGoal} from "./types.ts";
import {useFileContext} from "./context/FileProvider";
import ConfirmModal from "./ConfirmModal";
import "./Tree.css";
import {deleteGoalReferenceFromHierarchy, setTreeData} from "./context/treeDataSlice.ts";
import TreeRow from "./TreeRow.tsx";

export const INDENTATION_WIDTH = 24;

export type SortableTreeGoal = TreeGoal & {
    collapsed?: boolean;
    canHaveChildren?: boolean;
};

export type GoalReference = {
    goalId: TreeGoal["id"];
    instanceId: InstanceId;
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

TreeRow.displayName = "TreeRow";

interface TreeProps {
    existingGoalReferenceInstanceId: GoalReference[]
    setExistingGoalReferenceInstanceId: (existingGoalReferenceInstanceId: GoalReference[]) => void
}

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
                          pointerSensorOptions={{
                              activationConstraint: {
                                  distance: 5
                              }
                          }}/>
        </div>
    );
};

export default Tree;
