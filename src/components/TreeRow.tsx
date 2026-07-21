import React, {useState} from "react";

import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {BsFillTrash3Fill, BsGripVertical, BsXCircle} from "react-icons/bs";
import {FaMinus, FaPlus} from "react-icons/fa";

// import {SimpleTreeItemWrapper, TreeItemComponentProps} from "dnd-kit-sortable-tree";
// import {SimpleTreeItemWrapper, TreeItemComponentProps} from "@dnd-kit/react";
import {InstanceId, TreeGoal} from "./types.ts";
import {useFileContext} from "./context/FileProvider.tsx";
import {updateTextForGoalId} from "./context/treeDataSlice.ts";
import IconForGoalType from "./IconForGoalType.tsx";
import {isTextEmpty} from "./utils/GoalHint.tsx";
import {GoalReference, INDENTATION_WIDTH, SortableTreeGoal} from "./Tree.tsx";
import {ItemInstance} from "@headless-tree/core";

// type TreeRowProps = TreeItemComponentProps<SortableTreeGoal> & {
//     editingItemId: InstanceId | null
//     setEditingItemId: (itemId: InstanceId | null) => void
//     existingGoalReferenceInstanceId: GoalReference[]
//     onDeleteItem: (item: TreeGoal) => void;
// };
//
// const TreeRow = React.forwardRef<HTMLDivElement, TreeRowProps>(({
//                                                                            item,
//                                                                            childCount,
//                                                                            collapsed,
//                                                                            clone,
//                                                                            depth,
//                                                                            disableSorting,
//                                                                            handleProps,
//                                                                            onCollapse,
//                                                                            ghost,
//                                                                            editingItemId,
//                                                                            setEditingItemId,
//                                                                            onDeleteItem,
//                                                                            ...props
//                                                                        }, ref) => {

interface TreeRowProps {
    item: ItemInstance<TreeGoal>
    editingItemId: InstanceId | null
    setEditingItemId: (itemId: InstanceId | null) => void
    existingGoalReferenceInstanceId: GoalReference[]
    onDeleteItem: (item: TreeGoal) => void
    className?: string
}

const TreeRow: React.FC<TreeRowProps> = ({item, editingItemId, setEditingItemId, existingGoalReferenceInstanceId, onDeleteItem, className}) => {
    const treeItem = item.getItemData();
    const isEditing = (editingItemId === treeItem.instanceId);
    const iconSize = 16;
    const {dispatch, goals} = useFileContext();
    const goal = goals[treeItem.id];    // use the Goal from goals referenced by the tree node's id
    const [editedText, setEditedText] = useState(goal.content);

    const keyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            dispatch(updateTextForGoalId({id: goal.id, text: editedText}));
            setEditingItemId(null);
        } else if (e.key === "Escape") {
            setEditingItemId(null);
        }
    };

    return (
        <InputGroup key={item.getId()}
                    style={{paddingLeft: `${item.getItemMeta().level * 20}px`}}
                    ref={item.registerElement}
                    className={className}>
            <InputGroup.Text key={item.getId()} {...item.getProps()} className="hover">
                <BsGripVertical size={iconSize}/>
            </InputGroup.Text>
            {(item.isFolder()) ? (
                <InputGroup.Text>
                    {(item.isExpanded()) ? <FaMinus size={iconSize} onClick={item.collapse}/>
                                         : <FaPlus size={iconSize} onClick={item.expand}/>}
                </InputGroup.Text>
            ) : null}
            <InputGroup.Text>
                <IconForGoalType type={goal.type}/>
            </InputGroup.Text>
            <InputGroup.Text>   {/* XXX debug*/}
                {goal.id}
            </InputGroup.Text>
            <Form.Control placeholder="Goal name"
                          value={editedText}
                          onClick={(e) => {
                              setEditingItemId(goal.instanceId);
                              e.stopPropagation();
                          }}
                          onKeyDown={keyDown}
                          onChange={(e) => setEditedText(e.target.value)}
                          isInvalid={isTextEmpty(editedText) /* || isGoalDuplicatedAtThisLevel(editedText) */}/>
            <InputGroup.Text>
                {(isEditing) ? (
                    <BsXCircle size={iconSize}
                               onClick={() => {
                                   setEditingItemId(null);
                                   setEditedText(goal.content);
                               }}/>
                ) : (
                    <BsFillTrash3Fill size={iconSize}
                                      onClick={() => onDeleteItem(goal)}/>
                )}
            </InputGroup.Text>
        </InputGroup>
    );
};

export default TreeRow;