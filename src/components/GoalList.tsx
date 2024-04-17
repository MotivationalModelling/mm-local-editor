import WhoIcon from '../assets/img/Stakeholder.png';
import DoIcon from '../assets/img/Function.png';
import BeIcon from '../assets/img/Cloud.png';
import FeelIcon from '../assets/img/Heart.png';
import ConcernIcon from '../assets/img/Risk.png';
import DeleteIcon from '../assets/img/trash-alt-solid.svg'

import React, { useState, useRef, useEffect } from 'react';
import { Tab, Nav, Row, Col, Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import styles from './TabButtons.module.css';

// Define the structure for the content of each tab
type TabContent = {
  label: string;
  icon: string;
  rows: string[];
};

// Define the initial tabs with labels and corresponding icons
const tabs: TabContent[] = [
  { label: 'Who', icon: WhoIcon, rows: [] },
  { label: 'Do', icon: DoIcon, rows: [] },
  { label: 'Be', icon: BeIcon, rows: [] },
  { label: 'Feel', icon: FeelIcon, rows: [] },
  { label: 'Concern', icon: ConcernIcon, rows: [] },
];

const GoalList = React.forwardRef((props, ref) => {
  // State for the active tab
  const [activeKey, setActiveKey] = useState<string>(tabs[0].label);
  // State to keep track of all data associated with tabs
  const [tabData, setTabData] = useState<TabContent[]>(tabs.map(tab => ({ ...tab, rows: [''] })));

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus on the new input row
  // useEffect(() => {
  //   if (inputRef.current)
  //   inputRef.current.focus();
  // }, [tabData]);


  // Function to handle selecting a tab
  const handleSelect = (selectedKey: string) => {
    setActiveKey(selectedKey);
  };

  const handleKeyPress = (e, label: string) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default Enter key behavior
      handleAddRow(label);
    }
  };

  // Function to add a new row to the active tab
  const handleAddRow = (label: string) => {
    const newTabData = tabData.map(tab => {
      if (tab.label === label && tab.rows[tab.rows.length - 1] !== '') {
        return { ...tab, rows: [...tab.rows, ''] };
      }
      return tab;
    });
    setTabData(newTabData);

    setTimeout(() => {
      if (inputRef.current){
      inputRef.current.focus();
    }
    }, 0);
  };

  // Function to handle changes to input fields (rows) within a tab
  const handleRowChange = (label: string, index: number, value: string) => {
    const newTabData = tabData.map(tab => {
      if (tab.label === label) {
        const newRows = [...tab.rows];
        newRows[index] = value;
        return { ...tab, rows: newRows };
      }
      return tab;
    });
    setTabData(newTabData);
  };

  const handleDeleteRow = (label: string, index: number) => {
    const newTabData = tabData.map(tab => {
      if (tab.label === label) {
        if (tab.rows.length > 1) {
          const newRows = tab.rows.filter((_, rowIndex) => rowIndex !== index);
          return { ...tab, rows: newRows };
        }
      }
      return tab;
    });
    setTabData(newTabData);
  };

  // Get the last row of the active tab
  const activeTab = tabData.find(tab => tab.label === activeKey);
  // Check if the last row is not empty (it also checks if activeTab is defined)
  const canAddRow = activeTab && activeTab.rows[activeTab.rows.length - 1] !== '';


  const handleDragStart = (event: React.DragEvent<HTMLInputElement>) => {
    console.log("drag start");
    const itemText = event.currentTarget.value || "";
    props.setDraggedItem(itemText);
  };


  return (
    <div className={styles.tabContainer} ref={ref}>
      <Tab.Container activeKey={activeKey} 
      onSelect={handleSelect}>
        <Nav 
        variant="pills" 
        className="flex-row">
          {tabData.map(tab => (
            <Nav.Item 
              key={tab.label} 
              className={styles.navItem}>
              <Nav.Link
                eventKey={tab.label}
                className={`${styles.navLink} ${activeKey === tab.label ? 'active' : ''}`}
              >
              <img 
                src={tab.icon} 
                alt={`${tab.label} icon`} 
                className={styles.icon}
               />
              <span className={styles.labelBelowIcon}>{tab.label}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        <Tab.Content className={styles.contentArea}>
          {tabData.map(tab => (
            <Tab.Pane 
              key={tab.label} 
              eventKey={tab.label}>
              {/* <h4>{tab.label}</h4> */}
              {tab.rows.map((row, index) => (
                <Form.Group 
                  key={`${tab.label}-${index}`} 
                  as={Row} 
                  className={styles.formGroup}>
                  <Col sm={11}>
                    <Form.Control
                      onDragStart={handleDragStart}
                      draggable
                      type="text"
                      value={row}
                      onChange={e => handleRowChange(tab.label, index, e.target.value)}
                      placeholder={`Enter ${tab.label}...`}
                      spellCheck // Browser's spellcheck feature
                      className="bg-white" // White background for input row
                      onKeyDown={e => handleKeyPress(e, tab.label)}
                      ref={index === tab.rows.length - 1 ? inputRef : undefined} 
                    />
                  </Col>
                  {tab.rows.length > 1 && (
                  <Col sm={1}>
                    <Button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteRow(tab.label, index)}>
                      <img 
                        src={DeleteIcon} 
                        alt="Delete" 
                        className={styles.deleteIcon} />
                    </Button>
                  </Col>
                  )}
                </Form.Group>
              ))}
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </div>
  );
});

export default GoalList;
