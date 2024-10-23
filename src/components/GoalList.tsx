
import React, { useState, useRef } from "react";

import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Table from "react-bootstrap/Table";
import {TreeItem, useFileContext, tabs, newTreeItem, Label} from "./context/FileProvider";

import styles from "./TabButtons.module.css";
import useTreeData from "../hooks/useTreeData.ts";
import {BsFillTrash3Fill, BsPlus} from "react-icons/bs";

type GoalListProps = {
	setDraggedItem: (item: TreeItem | null) => void;
	groupSelected: TreeItem[];
	setGroupSelected: (grouSelected: TreeItem[]) => void;
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
		// const { tabData, setTabData } = useFileContext();
		const {tabs, goalsForLabel, deleteGoal, addGoalToTab, updateTextForGoalId} = useTreeData();
		const [activeKey, setActiveKey] = useState<Label>(tabs.keys().next().value ?? "Do");

		const inputRef = useRef<HTMLInputElement>(null);

		// Function to handle selecting a tab
		const handleSelect = (selectedKey: Label) => {
			if (selectedKey !== activeKey) {
				// Deselect all goals when switching to a new tab
				setGroupSelected([]);
				setActiveKey(selectedKey);
			}
		};

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
			addGoalToTab(newTreeItem({id: Date.now(), type}));
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

		const handleDeleteRow = (label: Label, index: number, row: TreeItem) => {
			deleteGoal(row);
			// const newTabData = tabData.map((tab) => {
			// 	if (tab.label === label) {
			// 		if (tab.rows.length > 1) {
			// 			const newRows = tab.rows.filter(
			// 				(_, rowIndex) => rowIndex !== index
			// 			);
			// 			return { ...tab, rows: newRows };
			// 		}
			// 	}
			// 	return tab;
			// });
			// setTabData(newTabData);
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
			if (row.content.trim() === "") {
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
			const allItemsInTab = goalsForLabel(activeKey);
			// Return true if all items in goal list are selected and list is not empty
			return (
				allItemsInTab &&
				allItemsInTab.length > 0 &&
				allItemsInTab.filter(row => row.content.trim() !== "").length > 0 && 
				allItemsInTab
					.filter(row => row.content.trim() !== "") 
					.every(row => groupSelected.some(item => item.id === row.id))
			);
		};

		// Select all items in the goals tab
		const handleSelectAll = () => {
			const allItemsInTab = goalsForLabel(activeKey);
			if (!allItemsInTab) return;

			if (allItemsInTab
				.filter(row => row.content.trim() !== "") // Exclude empty goals
				.every(row => groupSelected.some(item => item.id === row.id))) {
				const filteredGroupSelected = groupSelected.filter(
					item => !allItemsInTab.some(row => row.id === item.id)
				);
				setGroupSelected(filteredGroupSelected);
			} else {
				const newItems = allItemsInTab.filter(
					row => !groupSelected.some(item => item.id === row.id) && row.content.trim() !== ""
				);
				setGroupSelected([...groupSelected, ...newItems]);
			}
		};

		const isEmptyGoal = (goal: TreeItem): boolean => {
			return !goal.content.trim();
		};

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
				groupSelected.forEach((item: TreeItem) => deleteGoal(item));
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
											<Form.Group as={Row} className="mb-2">
													<Col sm={11}>
														<Form.Check
														type="checkbox"
														onChange={handleSelectAll}
														checked={isAllSelected()}
														/>
													</Col>
													</Form.Group>
											</th>
											<th style={{ display: 'flex' }}>Goal Name</th>
										</tr>
									</thead>
									<tbody>
									{goalsForLabel(label).map((row, index) => (
										<tr key={`${label}-${index}`}>
											<td>
											<Form.Check
												type="checkbox"
												onChange={() => handleCheckboxToggle(row)}
												checked={isChecked(row)}
												disabled={!row.content.trim()} 
											/>
											</td>
											<td>
											<InputGroup>
												<Form.Control
												onDragStart={() => handleDragStart(row)}
												draggable
												type="text"
												value={row.content}
												onChange={(e) =>
													updateTextForGoalId({id: row.id, text: e.target.value})
												}
												placeholder={`Enter ${label}...`}
												spellCheck
												className={(isEmptyGoal(row)) ? "text-body-secondary" : undefined}
												// style={{
												// 	color: isEmptyGoal(row) ? 'gray' : 'black',
												// 	opacity: isEmptyGoal(row) ? 0.6 : 1,
												// }}
												onKeyDown={(e) =>
													handleKeyPress(
													e as React.KeyboardEvent<HTMLInputElement>,
													label
													)
												}
												onBlur={(event) => handleSave(row, event.target.value)}
												ref={index === goalsForLabel(label).length - 1 ? inputRef : undefined}
												/>
												{goalsForLabel(label).length > 1 && (
												<Button className={styles.deleteButton}
														onClick={() => handleDeleteRow(label, index, row)}>
													<BsFillTrash3Fill />
													{/*<img*/}
													{/*src={DeleteIcon}*/}
													{/*alt="Delete"*/}
													{/*className={styles.deleteIcon}*/}
													{/*/>*/}
												</Button>
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
