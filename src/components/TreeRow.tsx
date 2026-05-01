import React, {useState} from "react";

import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {BsFillTrash3Fill, BsGripVertical, BsXCircle} from "react-icons/bs";
import {FaMinus, FaPlus} from "react-icons/fa";

import {SimpleTreeItemWrapper, TreeItemComponentProps} from "dnd-kit-sortable-tree";
import {InstanceId, TreeGoal} from "./types.ts";
import {useFileContext} from "./context/FileProvider.tsx";
import {updateTextForGoalId} from "./context/treeDataSlice.ts";
import IconForGoalType from "./IconForGoalType.tsx";
import {isTextEmpty} from "./utils/GoalHint.tsx";
import {GoalReference, INDENTATION_WIDTH, SortableTreeGoal} from "./Tree.tsx";

type TreeRowProps = TreeItemComponentProps<SortableTreeGoal> & {
    editingItemId: InstanceId | null
    setEditingItemId: (itemId: InstanceId | null) => void
    existingGoalReferenceInstanceId: GoalReference[]
    onDeleteItem: (item: TreeGoal) => void;
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
                                    style={{cursor: (disableSorting) ? "default" : "grab"}}
                                    size={iconSize}/>
                </InputGroup.Text>
                {(childCount) ? (
                    <InputGroup.Text>
                        {(collapsed) ? <FaPlus size={iconSize}/> : <FaMinus size={iconSize}/>}
                    </InputGroup.Text>
                ) : null}
                <InputGroup.Text>
                    <IconForGoalType type={goal.type}/>
                </InputGroup.Text>
                {(isEditing) ? (
                    <Form.Control placeholder="Goal name"
                                  defaultValue={goal.content}
                                  onKeyDown={keyDown}
                                  onChange={(e) => setEditedText(e.target.value)}
                                  isInvalid={isTextEmpty(editedText) /* || isGoalDuplicatedAtThisLevel(editedText) */}/>
                ) : (
                    <Form.Control placeholder="Goal name"
                                  value={goal.content}
                                  onClick={(e) => {
                                      setEditingItemId(goal.instanceId);
                                      e.stopPropagation();
                                  }}
                                  readOnly/>
                )}
                <InputGroup.Text>
                    {(isEditing) ? (
                        <BsXCircle size={iconSize}
                                   onClick={() => setEditingItemId(null)}/>
                    ) : (
                        <BsFillTrash3Fill size={iconSize}
                                          onClick={() => onDeleteItem(goal)}/>
                    )}
                </InputGroup.Text>
            </InputGroup>
        </SimpleTreeItemWrapper>
    );
});

export default TreeRow;