import DeleteIcon from "../assets/img/trash-alt-solid.svg";

import React, { useState, useRef } from "react";
// import { saveAs } from "file-saver";

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
				if (
					tab.label === label &&
					(tab.rows.length === 0 ||
						tab.rows[tab.rows.length - 1].content !== "")
				) {
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

		// Get the last row of the active tab
		// const activeTab = tabData.find(tab => tab.label === activeKey);
		// Check if the last row is not empty (it also checks if activeTab is defined)
		// const canAddRow = activeTab && activeTab.rows[activeTab.rows.length - 1] !== '';

		const handleDragStart = (row: TreeItem) => {
			console.log("drag start");
			setDraggedItem(row);
		};

		// const handleConvert = () => {
		// 	// Check if there is data here.
		// 	const hasNonEmptyRows = tabData
		// 		.find((tab) => tab.label === activeKey)
		// 		?.rows.some((row) => row.content !== "");
		// 	if (!hasNonEmptyRows) {
		// 		alert("Failed: Nothing to convert.");
		// 		return;
		// 	}

		// 	const dataToConvert = tabData
		// 		.map((tab) => ({
		// 			type: tab.label,
		// 			items: tab.rows.filter((row) => row.content.trim() !== ""),
		// 		}))
		// 		.filter((tab) => tab.items.length > 0);

		// 	if (dataToConvert.length > 0) {
		// 		const jsonBlob = new Blob([JSON.stringify(dataToConvert, null, 2)], {
		// 			type: "application/json",
		// 		});
		// 		saveAs(jsonBlob, "GoalList.json");
		// 	} else {
		// 		alert("Failed to convert: No data to convert.");
		// 	}
		// };
		//-------------------------------------------------------------------------------------
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

		const handleAddAll = () => {
			// Collect all unique, non-empty items across all tabs
			const allItems = tabData.flatMap((tab) =>
				tab.rows.filter((row) => row.content.trim() !== "")
			);

			// Filter out items already in groupSelected to avoid duplicates
			const newItems = allItems.filter(
				(item) => !groupSelected.some((selected) => selected.id === item.id)
			);

			setGroupSelected([...groupSelected, ...newItems]);
		};

		const isChecked = (row: TreeItem): boolean | undefined => {
			return groupSelected.some((item) => item.id === row.id);
		};

		const GroupDropBtn = () => {
			return (
				<div className="d-flex justify-content-end my-2">
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
						onClick={handleAddAll}
					>
						Select All
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
					<Nav variant="pills" className="flex-row">
						{tabData.map((tab) => (
							<Nav.Item key={tab.label} className={styles.navItem}>
								<Nav.Link
									eventKey={tab.label}
									className={`${styles.navLink} ${
										activeKey === tab.label ? "active" : ""
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
