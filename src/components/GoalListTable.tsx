import React, {RefObject, useState} from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import {Label, newTreeItem, TreeItem} from "./types.ts";
import {handleGoalBlur, handleGoalKeyPress, isEmptyGoal, isGoalDraggable, isTextEmpty} from "./utils/GoalHint.tsx";
import {
    addGoalToTab,
    deleteGoalFromGoalList,
    selectGoalsForLabel,
    updateTextForGoalId
} from "./context/treeDataSlice.ts";
import {useFileContext} from "./context/FileProvider.tsx";
import {BsFillTrash3Fill} from "react-icons/bs";

const goalDescriptionForLabel = (label: Label): string => {
    const goalNames: Partial<Record<Label, string>> = {
        "Who": "Stakeholder name"
    };
    return goalNames[label] ?? "Goal name";
};

interface Props {
	label: Label
	goals: TreeItem[]
    setDraggedItem: (item: TreeItem | null) => void;
	groupSelected: TreeItem[]
	setGroupSelected: (groupSelected: TreeItem[]) => void
	handleSynTableTree: (treeItem: TreeItem, editedText: string) => void
    inputRef: RefObject<HTMLInputElement>
}

const GoalListTable: React.FC<Props> = ({label, goals, setDraggedItem, groupSelected, setGroupSelected, handleSynTableTree, inputRef}) => {
	const treeData = useFileContext();
	const {dispatch, treeIds} = treeData;
	const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
	const [editedText, setEditedText] = useState<string>("");
	const [newRowAllowed, setNewRowAllowed] = useState<boolean>(false);

	// add new row
	const handleKeyPress = (
		e: React.KeyboardEvent<HTMLInputElement>,
		label: Label
	) => {
		if (e.key === "Enter") {
			e.preventDefault(); // Prevent default Enter key behavior
			dispatch(addGoalToTab(newTreeItem({type: label})));
		}
	};

	// Function to update tree data while user finish input changes
	const handleSave = (treeItem: TreeItem, text: string) => {
		handleSynTableTree(treeItem, text);
	};

	// Handle key press with GoalHint functions
	const handleTableKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, row: TreeItem, label: Label) => {

		// If we're editing this specific goal
		if (editingGoalId === row.id && !newRowAllowed) {
			handleGoalKeyPress(
				e,
				row.content, // original content
				editedText, // current content
				(content) => {
					// On save callback
					dispatch(updateTextForGoalId({id: row.id, text: content}));
					handleSave(row, content);
					// allow creating a new roll after current roll is saved
					setNewRowAllowed(true);

				},
				() => {
					// On cancel callback
					// empty or press esc will keep origjal item and stay on current row
					setEditedText(row.content);
					setNewRowAllowed(false);
				}
			);
		}
		// enter to create new row
		else if (newRowAllowed && e.key === "Enter") {
			// Second Enter after completing edit - only create new row if current row is not empty
			handleKeyPress(e, label);
			setNewRowAllowed(false);
			// setEditingGoalId(null); // Exit editing mode
		}
	};

	// Handle blur with GoalHint functions
	const handleTableBlur = (row: TreeItem) => {
		if (editingGoalId === row.id) {
			handleGoalBlur(
				row.content, // original content
				editedText, // current content
				(content) => {
					// On save callback
					dispatch(updateTextForGoalId({id: row.id, text: content}));
					handleSave(row, content);
					setEditingGoalId(null);
				},
				() => {
					// On cancel callback
					setEditingGoalId(null);
					setEditedText(row.content);
				}
			);
		} else {
			// Fallback to original save behaviour
			handleSave(row, row.content);
		}
	};

	const handleDeleteRow = (row: TreeItem) => {
		dispatch(deleteGoalFromGoalList(row));
		const filteredGroupSelected = groupSelected.filter(
			(item) => item.id !== row.id
		);

		setGroupSelected(filteredGroupSelected);
	};


	const handleDragStart = (row: TreeItem) => {
		console.log("drag start");
		setDraggedItem(row);
	};

	const handleCheckboxToggle = (row: TreeItem) => {
		// Ignore the item if the content is empty
		if (isEmptyGoal(row)) {
			return;
		}
		const isRowSelected = groupSelected.some((item) => item.id === row.id);

		let newGroupSelected: TreeItem[];

		// Create a new array based on the current groupSelected state
		if (isRowSelected) {
			newGroupSelected = groupSelected.filter((item) => item.id !== row.id);
		} else {
			newGroupSelected = [...groupSelected, row];
		}

		setGroupSelected(newGroupSelected);
	};
	const isChecked = (row: TreeItem): boolean | undefined => {
		return groupSelected.some((item) => item.id === row.id);
	};

	// Check whether all goals are selected in the table (excluding undefined ones)
	const isAllSelected = () => {
		const allItemsInTab = selectGoalsForLabel({treeData}, label);
		// Return true if all items in goal list are selected and list is not empty
		const nonEmptyItems = allItemsInTab.filter(row => !isEmptyGoal(row));

		return (
			nonEmptyItems.length > 0 &&
			groupSelected.length === nonEmptyItems.length
		);
	};

    const isGoalInHierarchy = (goal: TreeItem): boolean => {
        return treeIds[goal.id].length > 0;
    };

	// Select all items in the goals tab
	const handleSelectAll = () => {
		const allItemsInTab = selectGoalsForLabel({treeData}, label);
		if (!allItemsInTab) return;

		const nonEmptyItems = allItemsInTab.filter(row => !isEmptyGoal(row));
		if (nonEmptyItems.length === groupSelected.length) {
			setGroupSelected([]);
		} else {
			setGroupSelected(nonEmptyItems);
		}
	};

	return (
		<Table striped bordered hover>
			<thead>
				<tr>
					<th style={{width: '1px', whiteSpace: 'nowrap'}}>
						<Form.Group as={Row}>
							<Form.Check
								type="checkbox"
								onChange={handleSelectAll}
								checked={isAllSelected()}
							/>
						</Form.Group>
					</th>
					<th style={{display: 'flex'}}>
						{goalDescriptionForLabel(label)}
					</th>
				</tr>
			</thead>
			<tbody>
			{goals.map((row, index) => (
				<tr key={`${label}-${index}`}>
					<td>
						<Form.Check type="checkbox"
									onChange={() => handleCheckboxToggle(row)}
									checked={isChecked(row)}
									disabled={isEmptyGoal(row)}/>
					</td>
					<td>
						<InputGroup>
                            <Form.Control onDragStart={() => handleDragStart(row)}
                                          draggable={isGoalDraggable(row)} // Only draggable if not empty
                                          type="text"
                                          value={editingGoalId === row.id ? editedText : row.content} // Show edited text when editing
                                          onChange={(e) => {
                                              if (editingGoalId === row.id) {
                                                  setEditedText(e.target.value); // Allow free typing
                                              }
                                          }}
                                          onFocus={() => {
                                              // Start editing when focused
                                              if (editingGoalId !== row.id) {
                                                  setEditingGoalId(row.id);
                                                  setEditedText(row.content);
                                              }
                                          }}
                                          placeholder={`Enter ${label}...`}
                                          spellCheck
                                          className={`
											  ${isEmptyGoal(row) ? "text-muted" : ""}
											  ${editingGoalId === row.id && isTextEmpty(editedText) ? "is-invalid" : ""}
											  ${isGoalInHierarchy(row) ? "" : "bg-secondary-subtle"}
										  `}
                                          onKeyDown={(e) => handleTableKeyPress(e as React.KeyboardEvent<HTMLInputElement>, row, label)}
                                          onBlur={() => handleTableBlur(row)}
                                          ref={index === selectGoalsForLabel({treeData}, label).length - 1 ? inputRef : undefined}
                            />

							{selectGoalsForLabel({treeData}, label).length > 1 && (
								<Button onClick={() => handleDeleteRow(row)}>
									<BsFillTrash3Fill/>
								</Button>
							)}

							{editingGoalId === row.id && isTextEmpty(editedText) && (
								<div className="invalid-feedback d-block">
									Content cannot be empty
								</div>
							)}
						</InputGroup>
					</td>
				</tr>
			))}
			</tbody>
		</Table>
	);
};

export default GoalListTable;
