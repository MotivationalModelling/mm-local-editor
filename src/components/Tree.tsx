import React, { useRef, useState } from "react";
import WhoIcon from "../assets/img/Stakeholder.png";
import DoIcon from "../assets/img/Function.png";
import BeIcon from "../assets/img/Cloud.png";
import FeelIcon from "../assets/img/Heart.png";
import ConcernIcon from "../assets/img/Risk.png";
import Nestable, { NestableProps } from "react-nestable";
import { FaPlus, FaMinus } from "react-icons/fa";
import { TreeItem } from "./SectionPanel";
import { MdDelete, MdEdit, MdCheckCircle, MdCancel } from "react-icons/md";
import { Label, TabContent } from "./SectionPanel";

import "react-nestable/dist/styles/index.css";
import "./Tree.css";

// Inline style for element in Nestable, css style import not working
const treeListStyle: React.CSSProperties = {
	position: "relative",
	background: "white",
	display: "flex",
	border: "1px solid gray",
	borderRadius: "5px",
	alignItems: "center",
	padding: "0.1rem",
};

const treeInputStyle: React.CSSProperties = {
	backgroundColor: "#e0e0e0",
	border: "none",
	margin: 0,
	padding: 0,
	flex: 1,
	outline: "none",
	width: "100%",
	height: "100%",
};

const iconFromType = (type: Label) => {
	const typeToIcon = {
		Be: BeIcon,
		Do: DoIcon,
		Concern: ConcernIcon,
		Feel: FeelIcon,
		Who: WhoIcon
	};

	if (type in typeToIcon) {
		return typeToIcon[type];
	}
	throw Error(`iconFromType: Unknown type "${type}"`);
};

type TreeProps = {
	treeData: TreeItem[];
	tabData: TabContent[];
	existingItemIds: number[];
	existingError: boolean;
	setTreeData: (items: TreeItem[]) => void;
	setTabData: (tabData: TabContent[]) => void;
	setTreeIds: (value: React.SetStateAction<number[]>) => void;
};

// Goal icon in the tree
const IconComponent = ({ type }: { type: Label }) => {
	return (
		<img
			src={iconFromType(type)}
			alt={`${type} icon`}
			className="ms-2 me-1"
			style={{
				height: (type === "Who") ? "30px" : "20px",
			}}
		/>
	);
};

const Tree: React.FC<TreeProps> = ({
	treeData,
	tabData,
	existingItemIds,
	existingError,
	setTreeData,
	setTabData,
	setTreeIds,
}) => {
	const [editingItemId, setEditingItemId] = useState<number | null>(null);
	const [editedText, setEditedText] = useState<string>("");
	const [disableOnBlur, setDisableOnBlur] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// Remove item recursively from tree data
	const removeItemFromTree = (
		items: TreeItem[],
		idToRemove: number
	): TreeItem[] => {
		return items.reduce((acc, currentItem) => {
			if (currentItem.id === idToRemove) {
				return acc; // Skip this item
			}
			if (currentItem.children) {
				currentItem.children = removeItemFromTree(
					currentItem.children,
					idToRemove
				);
			}
			acc.push(currentItem);
			return acc;
		}, [] as TreeItem[]);
	};

	// Delete item by its id
	const handleDeleteItem = (item: TreeItem) => {
		const updatedTreeData = removeItemFromTree(treeData, item.id);
		setTreeData(updatedTreeData);
		setTreeIds((prevIds) => prevIds.filter((id) => id !== item.id));
	};

	const updateItemTextInTree = (
		items: TreeItem[],
		idToUpdate: number,
		newText: string
	): TreeItem[] => {
		return items.map((currentItem) => {
			if (currentItem.id === idToUpdate) {
				return { ...currentItem, content: newText }; // Update text of this item
			}
			if (currentItem.children) {
				currentItem.children = updateItemTextInTree(
					currentItem.children,
					idToUpdate,
					newText
				);
			}
			return currentItem;
		});
	};

	// Function for rendering every item
	const renderItem: NestableProps["renderItem"] = ({ item, collapseIcon }) => {
		const treeItem = item as TreeItem;
		const isEditing = editingItemId === treeItem.id;

		// Handle when edit button clicked
		const handleEdit = () => {
			setEditingItemId(treeItem.id);
			setEditedText(treeItem.content);
			// Defer code execution until after the browser has finished rendering updates to the DOM.
			requestAnimationFrame(() => {
				if (inputRef.current) {
					inputRef.current.focus();
				}
			});
		};

		// Handle double click to start editing
		const handleDoubleClick = () => {
			if (!isEditing) {
				handleEdit();
			}
		};

		// Update the tab data if exist while the tree data changed
		const updateTabDataContent = (
			label: Label,
			id: number,
			newText: string
		) => {
			const updatedTabData = tabData.map((tabContent) => {
				if (tabContent.label === label) {
					return {
						...tabContent,
						rows: tabContent.rows.map((row) => {
							if (row.id === id) {
								return {
									...row,
									content: newText,
								};
							}
							return row;
						}),
					};
				}
				return tabContent;
			});

			setTabData(updatedTabData);
		};

		// Handle saving edited text
		// Update the edited text in both the tree data and tab data
		const handleSave = () => {
			const updatedTreeData = updateItemTextInTree(
				treeData,
				treeItem.id,
				editedText
			);
			setTreeData(updatedTreeData);
			updateTabDataContent(treeItem.type, treeItem.id, editedText);
			setEditingItemId(null);
		};

		// Handle cancel edited text
		const handleCancel = () => {
			setEditingItemId(null);
			setEditedText(treeItem.content);
			// Defer code execution until after the browser has finished rendering updates to the DOM.
			requestAnimationFrame(() => {
				setDisableOnBlur(false);
			});
		};

		// Handle saving edited text when lost focus
		const handleBlur = () => {
			// Save changes only if cancel button was not clicked
			console.log(disableOnBlur);
			if (!disableOnBlur) {
				handleSave();
			}
			setDisableOnBlur(false);
		};

		// Handle save and cancel edited text when key pressed
		const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") handleSave();
			else if (e.key === "Escape") handleCancel();
		};

		const ICON_SIZE = 25;
		return (
			// While editing, set color to gray. If the drop item exist, set color to light red (#FF474C)
			<div
				style={{
					...treeListStyle,
					backgroundColor: isEditing
						? "#e0e0e0"
						: existingItemIds.includes(treeItem.id) && existingError
						? "#FF474C"
						: "white",
				}}
				className="tree-list"
				onDoubleClick={handleDoubleClick}
			>
				{collapseIcon}
				<IconComponent type={treeItem.type} />
				<div
					style={{
						padding: ".5rem",
						flex: 1,
					}}
				>
					{isEditing ? (
						<input
							ref={inputRef}
							type="text"
							value={editedText}
							onChange={(event) => setEditedText(event.target.value)}
							onBlur={handleBlur}
							onKeyDown={handleEditKeyDown}
							className="tree-input"
							style={treeInputStyle}
						/>
					) : (
						treeItem.content
					)}
				</div>

				{/* The hover effect can only created with pure css, onMouseEnter will 
            replace the Nestable onMouseEnter code and break the dragging functionality */}
				<div
					className="edit-icon"
					onClick={isEditing ? handleSave : handleEdit}
				>
					{isEditing ? (
						<MdCheckCircle size={ICON_SIZE} />
					) : (
						<MdEdit size={ICON_SIZE} />
					)}
				</div>
				<div
					className="delete-icon"
					onClick={isEditing ? handleCancel : () => handleDeleteItem(treeItem)}
					onMouseEnter={() => setDisableOnBlur(true)}
				>
					{isEditing ? (
						<MdCancel size={ICON_SIZE} />
					) : (
						<MdDelete size={ICON_SIZE} />
					)}
				</div>
			</div>
		);
	};

	// Button for collapse and expand
	const Collapser = ({ isCollapsed }: { isCollapsed: boolean }) => {
		const iconSize = 13;
		return (
			<div
				style={{
					display: "flex",
					paddingLeft: "0.5rem",
					cursor: "pointer",
				}}
			>
				{isCollapsed ? <FaPlus size={iconSize} /> : <FaMinus size={iconSize} />}
			</div>
		);
	};

	return (
		<div style={{ width: "100%", height: "100%", alignSelf: "flex-start" }}>
			<Nestable
				onChange={({ items }) => setTreeData(items as TreeItem[])}
				items={treeData}
				renderItem={renderItem}
				renderCollapseIcon={({ isCollapsed }) => (
					<Collapser isCollapsed={isCollapsed} />
				)}
			/>
		</div>
	);
};

export default Tree;
