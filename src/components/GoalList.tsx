import React, {useState, useRef} from "react";

import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Table from "react-bootstrap/Table";
import {TreeItem, useFileContext, newTreeItem, Label} from "./context/FileProvider";

import styles from "./TabButtons.module.css";
import {BsFillTrash3Fill, BsPlus} from "react-icons/bs";
import {isEmptyGoal,isGoalDraggable,isTextEmpty,handleGoalKeyPress,handleGoalBlur} from "./utils/GoalHint.tsx"
import {addGoalToTab,deleteGoalFromGoalList, selectGoalsForLabel, updateTextForGoalId} from "./context/treeDataSlice.ts";

const goalDescriptionForLabel = (label: Label): string => {
    const goalNames: Partial<Record<Label, string>> = {
        "Who": "Stakeholder name"
    };
    return goalNames[label] ?? "Goal name";
};

type GoalListProps = {
	setDraggedItem: (item: TreeItem | null) => void;
	groupSelected: TreeItem[];
	setGroupSelected: (groupSelected: TreeItem[]) => void;
	handleSynTableTree: (treeItem: TreeItem, editedText: string) => void;
	handleDropGroupSelected: () => void;
};

const GoalList = React.forwardRef<HTMLDivElement, GoalListProps>(
	(
		{
			setDraggedItem,
			groupSelected,
			setGroupSelected,
			handleSynTableTree,
			handleDropGroupSelected,
		},
		ref
	) => {
		const treeData = useFileContext();
		const {dispatch, tabs} = treeData;
		const [activeKey, setActiveKey] = useState<Label>(tabs.keys().next().value ?? "Do");

		// Add editing state for the input fields
		const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
		const [editedText, setEditedText] = useState<string>("");
        const [newRowAllowed, setNewRowAllowed] = useState<boolean>(false);
		const inputRef = useRef<HTMLInputElement>(null);

		// Function to handle selecting a tab
		const handleSelect = (selectedKey: Label) => {
			if (selectedKey !== activeKey) {
				// Deselect all goals when switching to a new tab
				setGroupSelected([]);
				setActiveKey(selectedKey);
			}
		};

		// add new row 
		const handleKeyPress = (
			e: React.KeyboardEvent<HTMLInputElement>,
			label: Label
		) => {
			if (e.key === "Enter") {
				e.preventDefault(); // Prevent default Enter key behavior
				handleAddRow(label);
			}
		};

		// Function to add a new row to the active tab
		const handleAddRow = (type: Label) => {
			dispatch(addGoalToTab(newTreeItem({type})));
			// const newTabData = tabData.map((tab) => {
			// 	if (tab.label === label) {
			// 		return {
			// 			...tab,
			// 			rows: [
			// 				...tab.rows,
			// 				{
			// 					id: Date.now(),
			// 					type: tab.label,
			// 					content: "",
			// 				},
			// 			],
			// 		};
			// 	}
			// 	return tab;
			// });
			// setTabData(newTabData);

			// Defer code execution until after the browser has finished rendering updates to the DOM.
			requestAnimationFrame(() => {
				if (inputRef.current) {
					inputRef.current.focus();
				}
			});
		};

		// Function to handle changes to input fields (rows) within a tab
		// const handleRowChange = (label: string, index: number, value: string) => {
		// 	const newTabData = tabData.map((tab) => {
		// 		if (tab.label === label) {
		// 			const newRows = [...tab.rows];
		// 			newRows[index].content = value;
		// 			console.log(
		// 				"id" + newRows[index].id + "content" + newRows[index].content
		// 			); // Debug log
		// 			return { ...tab, rows: newRows };
		// 		}
		// 		return tab;
		// 	});
		// 	setTabData(newTabData);
		// };

		// Function to update tree data while user finish input changes
		const handleSave = (treeItem: TreeItem, text: string) => {
			handleSynTableTree(treeItem, text);
		};
		
		// Handle key press with GoalHint functions
		const handleTableKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, row: TreeItem, label: Label) => {
			
			// If we're editing this specific goal
			if (editingGoalId === row.id && newRowAllowed === false) {
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
			else if (newRowAllowed === true && e.key === "Enter") {
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
				// Fallback to original save behavior
				handleSave(row, row.content);
			}
		};
		const handleDeleteRow = (row: TreeItem) => {
			dispatch(deleteGoalFromGoalList({item:row}));
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
			const allItemsInTab = selectGoalsForLabel({treeData}, activeKey);
			// Return true if all items in goal list are selected and list is not empty
			const nonEmptyItems = allItemsInTab.filter(row => !isEmptyGoal(row));
			return (
				nonEmptyItems.length > 0 &&
				groupSelected.length === nonEmptyItems.length
			);
		};

		// Select all items in the goals tab
		const handleSelectAll = () => {
			const allItemsInTab = selectGoalsForLabel({treeData}, activeKey);
			if (!allItemsInTab) return;

			const nonEmptyItems = allItemsInTab.filter(row => !isEmptyGoal(row));
			if (nonEmptyItems.length === groupSelected.length) {
				setGroupSelected([]);
			} else {
				setGroupSelected(nonEmptyItems);
			}
		};

		// const isEmptyGoal = (goal: TreeItem): boolean => {
		// 	return !goal.content.trim();
		// };

		const handleDeleteSelected = () => {
			const confirmed = window.confirm("Are you sure you want to delete all selected goals?");

			if (confirmed) {
			// 	const newTabData = tabData.map((tab) => {
			// 		if (tab.label === activeKey) {
			// 			// Get selected goals
			// 			const newRows = tab.rows.filter(
			// 				(row) => !groupSelected.some((selected) => selected.id === row.id)
			// 			);
			// 			return { ...tab, rows: newRows };
			// 		}
			// 		return tab;
			// 	});
			//
			// 	setTabData(newTabData);

				groupSelected.forEach((item: TreeItem) => dispatch(deleteGoalFromGoalList({item:item})));
				setGroupSelected([]); 
			}
		};

		const GroupDropBtn = () => {
			return (
				<div className="d-flex justify-content-end my-2">
					<Button
						variant="primary"
						className="me-2"
						disabled={groupSelected.length <= 0}
						onClick={handleDropGroupSelected}
					>
						{/* Click to Drop To Right Panel */}
						Add Group
					</Button>
					<Button
						variant="danger"
						className="me-2"
						disabled={groupSelected.length <= 0}
						onClick={handleDeleteSelected}
					>
						Delete Selected
					</Button>
				</div>
			);
		};
		//------------------------------------------------------------------

		return (
			<div className={styles.tabContainer} ref={ref}>
				<Tab.Container activeKey={activeKey ?? undefined}
                               onSelect={(label: string | null) => handleSelect(label as Label ?? "Be")}>
					<Nav variant="tabs" className="flex-row">
						{[...tabs.values()].map((tab) => (
							<Nav.Item key={tab.label} className={styles.navItem}>
								<Nav.Link eventKey={tab.label}
									active={activeKey === tab.label}
									className={`${styles.navLink} ${
										activeKey === tab.label ? "bg-primary" : ""
									}`}
								>
									<img
										src={tab.icon}
										alt={`${tab.label} icon`}
										className={styles.icon}
										style={{ width: tab.label === "Who" ? "0.7cm" : "1.5cm" }}
									/>
									<span className={styles.labelBelowIcon}>{tab.label}</span>
								</Nav.Link>
							</Nav.Item>
						))}
					</Nav>
					<Tab.Content className={styles.contentArea}>
						{[...tabs.keys()].map((label) => (
							<Tab.Pane key={label} eventKey={label}>
								<Table striped bordered hover>
									<thead>
										<tr>
											<th style={{ width: '1px', whiteSpace: 'nowrap' }}>
											<Form.Group as={Row}>
														<Form.Check
														type="checkbox"
														onChange={handleSelectAll}
														checked={isAllSelected()}
														/>
													</Form.Group>
											</th>
											<th style={{ display: 'flex' }}>
                                                {goalDescriptionForLabel(label)}
											</th>
										</tr>
									</thead>
									<tbody>
									{selectGoalsForLabel({treeData}, label).map((row, index) => (
										<tr key={`${label}-${index}`}>
											<td>
											<Form.Check
												type="checkbox"
												onChange={() => handleCheckboxToggle(row)}
												checked={isChecked(row)}
												disabled={isEmptyGoal(row)}
											/>
											</td>
											<td>
										<InputGroup>
										<Form.Control
											onDragStart={() => handleDragStart(row)}
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
											`.trim()}
											onKeyDown={(e) => handleTableKeyPress(e as React.KeyboardEvent<HTMLInputElement>, row, label)}
											onBlur={() => handleTableBlur(row)}
											ref={index === selectGoalsForLabel({treeData}, label).length - 1 ? inputRef : undefined}
										/>

										{selectGoalsForLabel({treeData}, label).length > 1 && (
											<Button className={styles.deleteButton}
													onClick={() => handleDeleteRow(row)}>
												<BsFillTrash3Fill />
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
								<div className="d-flex justify-content-between align-items-center mt-3">
									<Button className="me-2"
											onClick={() => handleAddRow(activeKey)}
											variant="primary">
										<BsPlus/>
									</Button>
									<div className="text-muted">
										Drag goals to arrange hierarchy
									</div>
								</div>
							</Tab.Pane>
						))}
					</Tab.Content>
				</Tab.Container>
				<GroupDropBtn />
			</div>
		);
	}
);

export default GoalList;
