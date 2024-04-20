import WhoIcon from "../assets/img/Stakeholder.png";
import DoIcon from "../assets/img/Function.png";
import BeIcon from "../assets/img/Cloud.png";
import FeelIcon from "../assets/img/Heart.png";
import ConcernIcon from "../assets/img/Risk.png";
import DeleteIcon from "../assets/img/trash-alt-solid.svg";

import React, { useState, useRef, useEffect } from "react";
import { saveAs } from "file-saver";

import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { TreeItem, TabContent } from "./SectionPanel";

import styles from "./TabButtons.module.css";

// Define the initial tabs with labels and corresponding icons
const tabs: TabContent[] = [
	{ label: "Who", icon: WhoIcon, rows: [] },
	{ label: "Do", icon: DoIcon, rows: [] },
	{ label: "Be", icon: BeIcon, rows: [] },
	{ label: "Feel", icon: FeelIcon, rows: [] },
	{ label: "Concern", icon: ConcernIcon, rows: [] },
];

type GoalListProps = {
	setDraggedItem: React.Dispatch<React.SetStateAction<TreeItem | null>>;
	tabData: TabContent[];
	setTabData: React.Dispatch<React.SetStateAction<TabContent[]>>;
};

const GoalList = React.forwardRef<HTMLDivElement, GoalListProps>(
	({ setDraggedItem, tabData, setTabData }, ref) => {
		const [activeKey, setActiveKey] = useState<string | null>(tabs[0].label);

		useEffect(() => {
			const initialTabs = tabs.map((tab) => ({
				...tab,
				rows: [
					...tab.rows,
					{
						id: Date.now(),
						type: tab.label,
						content: "",
					},
				],
			}));
			setTabData(initialTabs);
		}, []);

		const inputRef = useRef<HTMLInputElement>(null);

		// Auto focus on the new input row
		// useEffect(() => {
		//   if (inputRef.current)
		//   inputRef.current.focus();
		// }, [tabData]);

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

		const handleDeleteRow = (label: string, index: number) => {
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
		};

		// Get the last row of the active tab
		// const activeTab = tabData.find(tab => tab.label === activeKey);
		// Check if the last row is not empty (it also checks if activeTab is defined)
		// const canAddRow = activeTab && activeTab.rows[activeTab.rows.length - 1] !== '';

		const handleDragStart = (row: TreeItem) => {
			console.log("drag start");
			setDraggedItem(row);
		};

		const handleConvert = () => {
			// Check if there is data here.
			const hasNonEmptyRows = tabData
				.find((tab) => tab.label === activeKey)
				?.rows.some((row) => row.content !== "");
			if (!hasNonEmptyRows) {
				alert("Failed: Nothing to convert.");
				return;
			}

			const dataToConvert = tabData
				.map((tab) => ({
					type: tab.label,
					items: tab.rows.filter((row) => row.content.trim() !== ""),
				}))
				.filter((tab) => tab.items.length > 0);

			if (dataToConvert.length > 0) {
				const jsonBlob = new Blob([JSON.stringify(dataToConvert, null, 2)], {
					type: "application/json",
				});
				saveAs(jsonBlob, "GoalList.json");
			} else {
				alert("Failed to convert: No data to convert.");
			}
		};

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
                    style={{width: tab.label == "Who" ? "0.7cm" : "1.5cm"}}
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
												ref={
													index === tab.rows.length - 1 ? inputRef : undefined
												}
											/>
										</Col>
										{tab.rows.length > 1 && (
											<Col sm={1}>
												<Button
													className={styles.deleteButton}
													onClick={() => handleDeleteRow(tab.label, index)}
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
				<div className={styles.buttonContainer}>
					<Button onClick={handleConvert} className={styles.convertButton}>
						Convert
					</Button>
				</div>
			</div>
		);
	}
);

export default GoalList;
