import React, {useRef, useState} from "react";

import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import {useFileContext} from "./context/FileProvider";
import {Label, newTreeItem, TreeItem} from "./types.ts";

import styles from "./TabButtons.module.css";
import {BsPlus} from "react-icons/bs";
import {addGoalToTab, deleteGoalFromGoalList, selectGoalsForLabel} from "./context/treeDataSlice.ts";
import GoalListTable from "./GoalListTable.tsx";


type GoalListProps = {
    setDraggedItem: (item: TreeItem | null) => void;
    groupSelected: TreeItem[];
    setGroupSelected: (groupSelected: TreeItem[]) => void;
    handleSynTableTree: (treeItem: TreeItem, editedText: string) => void;
    handleDropGroupSelected: () => void;
};

const GoalList = React.forwardRef<HTMLDivElement, GoalListProps>(({setDraggedItem, groupSelected, setGroupSelected, handleSynTableTree, handleDropGroupSelected,}, ref) => {
        const treeData = useFileContext();
        const {dispatch, tabs} = treeData;
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

        // Function to add a new row to the active tab
        const handleAddRow = (type: Label) => {
            dispatch(addGoalToTab(newTreeItem({type})));

            // Defer code execution until after the browser has finished rendering updates to the DOM.
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            });
        };

        const handleDeleteSelected = () => {
            const confirmed = window.confirm("Are you sure you want to delete all selected goals?");

            if (confirmed) {
                groupSelected.forEach((item: TreeItem) => dispatch(deleteGoalFromGoalList(item)));
                setGroupSelected([]);
            }
        };

        const GroupDropBtn = () => {
            return (
                <div className="d-flex justify-content-end my-2">
                    <Button variant="primary"
                            className="me-2"
                            disabled={groupSelected.length <= 0}
                            onClick={handleDropGroupSelected}>
                        {/* Click to Drop To Right Panel */}
                        Add Group
                    </Button>
                    <Button variant="danger"
                            className="me-2"
                            disabled={groupSelected.length <= 0}
                            onClick={handleDeleteSelected}>
                        Delete Selected
                    </Button>
                </div>
            );
        };

        return (
            <div className={styles.tabContainer} ref={ref}>
                <Tab.Container activeKey={activeKey ?? undefined}
                               onSelect={(label: string | null) => handleSelect(label as Label ?? "Be")}>
                    <Nav variant="tabs" className="flex-row">
                        {[...tabs.values()].map((tab) => (
                            <Nav.Item key={tab.label} className={styles.navItem}>
                                <Nav.Link eventKey={tab.label}
                                          active={activeKey === tab.label}
                                          className={`${styles.navLink} ${(activeKey === tab.label) ? "bg-primary" : ""}`}>
                                    <img src={tab.icon}
                                         alt={`${tab.label} icon`}
                                         className={styles.icon}
                                         style={{width: (tab.label === "Who") ? "0.7cm" : "1.5cm"}}/>
                                    <span className={styles.labelBelowIcon}>{tab.label}</span>
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                    <Tab.Content className={styles.contentArea}>
                        {[...tabs.keys()].map((label) => (
                            <Tab.Pane key={label} eventKey={label}>
                                <GoalListTable label={label}
                                               goals={selectGoalsForLabel({treeData}, label)}
                                               setDraggedItem={setDraggedItem}
                                               groupSelected={groupSelected}
                                               setGroupSelected={setGroupSelected}
                                               handleSynTableTree={handleSynTableTree}
                                               inputRef={inputRef}/>
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
