import DeleteIcon from "/img/trash-alt-solid.svg";

import React, { useState, useRef } from "react";

import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { TreeItem, useFileContext, tabs } from "./context/FileProvider";

import styles from "./TabButtons.module.css";

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
		const [activeKey, setActiveKey] = useState<string | null>(tabs[0].label);
		const { tabData, setTabData } = useFileContext();

		const inputRef = useRef<HTMLInputElement>(null);

		// Function to handle selecting a tab
		const handleSelect = (selectedKey: string | null) => {
			setActiveKey(selectedKey);
		};

		const handleKeyPress = (
			e: React.KeyboardEvent<HTMLInputElement>,
			label: string
		) => {
			if (e.key === "Enter") {
				e.preventDefault(); // Prevent default Enter key behavior
				handleAddRow(label);
			}
		};

		// Function to add a new row to the active tab
		const handleAddRow = (label: string) => {
			const newTabData = tabData.map((tab) => {
				if (tab.label === label) {
					return {
						...tab,
						rows: [
							...tab.rows,
							{
								id: Date.now(),
								type: tab.label,
								content: "",
							},
						],
					};
				}
				return tab;
			});
			setTabData(newTabData);

			// Defer code execution until after the browser has finished rendering updates to the DOM.
			requestAnimationFrame(() => {
				if (inputRef.current) {
					inputRef.current.focus();
				}
			});
		};

		// Function to handle changes to input fields (rows) within a tab
		const handleRowChange = (label: string, index: number, value: string) => {
			const newTabData = tabData.map((tab) => {
				if (tab.label === label) {
					const newRows = [...tab.rows];
					newRows[index].content = value;
					console.log(
						"id" + newRows[index].id + "content" + newRows[index].content
					); // Debug log
					return { ...tab, rows: newRows };
				}
				return tab;
			});
			setTabData(newTabData);
		};

		// Function to update tree data while user finish input changes
		const handleSave = (treeItem: TreeItem, text: string) => {
			handleSynTableTree(treeItem, text);
		};

		const handleDeleteRow = (label: string, index: number, row: TreeItem) => {
			const newTabData = tabData.map((tab) => {
				if (tab.label === label) {
					if (tab.rows.length > 1) {
						const newRows = tab.rows.filter(
							(_, rowIndex) => rowIndex !== index
						);
						return { ...tab, rows: newRows };
					}
				}
				return tab;
			});
			setTabData(newTabData);
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
			const allItemsInTab = tabData.find(tab => tab.label === activeKey)?.rows;
			return allItemsInTab && allItemsInTab.length > 0 &&
				allItemsInTab
					.filter(row => row.content.trim() !== "") // Exclude empty goals
					.every(row => groupSelected.some(item => item.id === row.id));
		};
		
		// Select all items in the goals tab
		const handleSelectAll = () => {
			const allItemsInTab = tabData.find(tab => tab.label === activeKey)?.rows;
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

		const GroupDropBtn = () => {
			return (
				<div className="d-flex justify-content-end my-2">
					<Button 
                className="me-2"
                onClick={() => handleAddRow(activeKey || '')}
                variant="primary"
            > Add Goal
            	</Button>
					<Button
						variant="primary"
						className="me-2"
						// style={{ display: groupSelected.length > 0 ? "flex" : "none" }}
						disabled={groupSelected.length <= 0}
						onClick={handleDropGroupSelected}
					>
						{/* Click to Drop To Right Panel */}
						Add Group
					</Button>

					<Button
						variant="primary"
						style={{
							display: tabData.some((tab) => tab.rows.length > 0)
								? "flex"
								: "none",
						}}
						onClick={handleSelectAll}
					>
						{isAllSelected() ? "Deselect All" : "Select All"}
					</Button>
				</div>
			);
		};
		//------------------------------------------------------------------

		return (
			<div className={styles.tabContainer} ref={ref}>
				<Tab.Container
					activeKey={activeKey ?? undefined}
					onSelect={handleSelect}
				>
					<Nav variant="tabs" className="flex-row">
						{tabData.map((tab) => (
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
						{tabData.map((tab) => (
							<Tab.Pane key={tab.label} eventKey={tab.label}>
								 <Form.Group as={Row} className="mb-2">
									<Col sm={11}>
										<Form.Check
											type="checkbox"
											label={isAllSelected() ? "Deselect All" : "Select All"}
											onChange={handleSelectAll}
											checked={isAllSelected()} // Set checkbox state based on selection
										/>
									</Col>
								</Form.Group>
								{/* Goal Rows */}
								{tab.rows.map((row, index) => (
									<Form.Group
										key={`${tab.label}-${index}`}
										as={Row}
										className={styles.formGroup}
									>
										<Col sm={11}>
											<InputGroup>
												{row.content && (
													<InputGroup.Checkbox
														onChange={() => handleCheckboxToggle(row)}
														checked={isChecked(row)}
													/>
												)}
												<Form.Control
													onDragStart={() => handleDragStart(row)}
													draggable
													type="text"
													value={row.content}
													onChange={(e) =>
														handleRowChange(tab.label, index, e.target.value)
													}
													placeholder={`Enter ${tab.label}...`}
													spellCheck
													className="bg-white"
													onKeyDown={(e) =>
														handleKeyPress(
															e as React.KeyboardEvent<HTMLInputElement>,
															tab.label
														)
													}
													onBlur={(event) =>
														handleSave(row, event.target.value)
													}
													ref={
														index === tab.rows.length - 1 ? inputRef : undefined
													}
												/>
											</InputGroup>
										</Col>
										{tab.rows.length > 1 && (
											<Col sm={1}>
												<Button
													className={styles.deleteButton}
													onClick={() => handleDeleteRow(tab.label, index, row)}
												>
													<img
														src={DeleteIcon}
														alt="Delete"
														className={styles.deleteIcon}
													/>
												</Button>
											</Col>
										)}
									</Form.Group>
								))}
								<div className="text-muted text-end mt-3">
									Drag goals to arrange hierarchy
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
