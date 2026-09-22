import React, {useEffect, useState} from "react";
import Form from "react-bootstrap/Form";
import {
    BsChevronDown,
    BsChevronRight,
    BsFillTrash3Fill,
    BsGripVertical,
    BsXCircle,
} from "react-icons/bs";
import {ItemInstance} from "@headless-tree/core";

import IconForGoalType from "./IconForGoalType.tsx";
import {useFileContext} from "./context/FileProvider.tsx";
import {updateTextForGoalId} from "./context/treeDataSlice.ts";
import {InstanceId, TreeGoal} from "./types.ts";
import {isTextEmpty} from "./utils/GoalHint.tsx";

interface TreeRowProps {
    item: ItemInstance<TreeGoal>
    editingItemId: InstanceId | null
    setEditingItemId: (itemId: InstanceId | null) => void
    indentationWidth: number
    onDeleteItem: (item: TreeGoal) => void
}

const ICON_SIZE = 16;

const TreeRow: React.FC<TreeRowProps> = ({item, editingItemId, setEditingItemId, indentationWidth, onDeleteItem}) => {
    const treeItem = item.getItemData();
    const isEditing = editingItemId === treeItem.instanceId;
    const hasChildren = item.getChildren().length > 0;
    const {dispatch, goals} = useFileContext();
    const goal = goals[treeItem.id];
    const [editedText, setEditedText] = useState(goal.content);

    useEffect(() => {
        if (!isEditing) {
            setEditedText(goal.content);
        }
    }, [goal.content, isEditing]);

    const finishEditing = () => {
        if (isTextEmpty(editedText)) {
            setEditedText(goal.content);
        } else if (editedText !== goal.content) {
            dispatch(updateTextForGoalId({id: goal.id, text: editedText}));
        }
        setEditingItemId(null);
    };

    const cancelEditing = () => {
        setEditedText(goal.content);
        setEditingItemId(null);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            finishEditing();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelEditing();
        }
    };

    return (
        <div {...item.getProps()}
             ref={item.registerElement}
             className={`tree-row ${item.isUnorderedDragTarget() ? "tree-row--drop-target" : ""}`}
             style={{paddingLeft: `${item.getItemMeta().level * indentationWidth}px`}}>
            <button {...item.getDragHandleProps()}
                    type="button"
                    className="tree-row__button tree-row__drag-handle"
                    aria-label={`Move ${goal.content}`}>
                <BsGripVertical size={ICON_SIZE}/>
            </button>
            <button type="button"
                    className={`tree-row__button tree-row__toggle ${hasChildren ? "" : "tree-row__toggle--empty"}`}
                    aria-label={hasChildren ? `${item.isExpanded() ? "Collapse" : "Expand"} ${goal.content}` : undefined}
                    disabled={!hasChildren}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (item.isExpanded()) {
                            item.collapse();
                        } else {
                            item.expand();
                        }
                    }}>
                {hasChildren && (
                    item.isExpanded()
                        ? <BsChevronDown size={ICON_SIZE}/>
                        : <BsChevronRight size={ICON_SIZE}/>
                )}
            </button>
            <span className="tree-row__type-icon" aria-hidden="true">
                <IconForGoalType type={goal.type} className="tree-row__type-image"/>
            </span>
            <Form.Control type="text"
                          className="tree-row__input"
                          placeholder="Goal name"
                          aria-label={`Edit ${goal.type} goal`}
                          value={editedText}
                          onClick={(event) => event.stopPropagation()}
                          onFocus={() => {
                              item.setFocused();
                              setEditingItemId(treeItem.instanceId);
                          }}
                          onKeyDown={handleKeyDown}
                          onBlur={finishEditing}
                          onChange={(event) => setEditedText(event.target.value)}
                          isInvalid={isTextEmpty(editedText)}/>
            <button type="button"
                    className="tree-row__button tree-row__action"
                    aria-label={isEditing ? `Cancel editing ${goal.content}` : `Delete ${goal.content}`}
                    onMouseDown={(event) => {
                        if (isEditing) {
                            event.preventDefault();
                        }
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (isEditing) {
                            cancelEditing();
                        } else {
                            onDeleteItem(treeItem);
                        }
                    }}>
                {isEditing
                    ? <BsXCircle size={ICON_SIZE}/>
                    : <BsFillTrash3Fill size={ICON_SIZE}/>
                }
            </button>
        </div>
    );
};

export default TreeRow;
