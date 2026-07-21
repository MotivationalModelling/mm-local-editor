import React, {useMemo, useRef, useState} from "react";
import {InstanceId, newTreeGoal, TreeGoal} from "./types.ts";
import {useFileContext} from "./context/FileProvider";
import ConfirmModal from "./ConfirmModal";
import "./Tree.css";
import {deleteGoalReferenceFromHierarchy, setChildrenOfNodeId, setTreeData} from "./context/treeDataSlice.ts";
import TreeRow from "./TreeRow.tsx";
import {useTree} from "@headless-tree/react";
import {createOnDropHandler, dragAndDropFeature, ItemInstance, syncDataLoaderFeature} from "@headless-tree/core";

export const INDENTATION_WIDTH = 24;

export type SortableTreeGoal = TreeGoal & {
    collapsed?: boolean;
    canHaveChildren?: boolean;
};

export type GoalReference = {
    goalId: TreeGoal["id"];
    instanceId: InstanceId;
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
    const deletingItemRef = useRef<TreeGoal | null>(null);
    const {treeData, goals, dispatch} = useFileContext();
    const topTreeGoal = useMemo(() => newTreeGoal({
        id: -999,
        content: "(Top Level Goal)",
        type: "Do",
        children: treeData,
    }), [treeData]);
    const goalForId = (id: string): TreeGoal => {
        return (id === String(topTreeGoal.id)) ? topTreeGoal : goals[Number(id)];
    };
    const tree = useTree<TreeGoal>({
        rootItemId: String(topTreeGoal.id),
        dataLoader: {
            getItem: (id) => goalForId(id),
            getChildren: (id) => {
                console.log(`getChildren ${id}`);
                return goalForId(id).children?.map((child) => String(child.id)) ?? [];
            },
        },
        isItemFolder: (item: ItemInstance<TreeGoal>): boolean => (item.getItemData().children?.length ?? 0) > 0,
        getItemName: (item: ItemInstance<TreeGoal>): string => item.getItemData().content,
        features: [syncDataLoaderFeature, dragAndDropFeature],
        indent: 20,
        canReorder: true,
        onDrop: createOnDropHandler((item, newChildren) => {
            const children = newChildren.map(childId => goalForId(childId));
            if (item.getId() === "-999") {
                dispatch(setTreeData(children));
            } else {
                dispatch(setChildrenOfNodeId({id: item.getId(), children}))
            }
            console.log(`update item ${item.getId()} with children`, newChildren);
        }),
    });

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

    return (
        <div {...tree.getContainerProps()}
             className="tree"
             ref={tree.registerElement}>
            <ConfirmModal show={showDeleteWarning}
                          title="Delete Warning"
                          message="You are going to delete a goal with children goals, are you sure?"
                          onHide={handleDeleteCancel}
                          onConfirm={deleteItem}/>
            {tree.getItems().map((item) => (
                <TreeRow item={item}
                         editingItemId={editingItemId}
                         setEditingItemId={setEditingItemId}
                         existingGoalReferenceInstanceId={existingGoalReferenceInstanceId}
                         onDeleteItem={handleDeleteItem}
                         className="py-1"/>
            ))}
            <div style={tree.getDragLineStyle()} className="dragline" />
        </div>
    );
};

export default Tree;
