import WhoIcon from '../assets/img/Stakeholder.png';
import DoIcon from '../assets/img/Function.png';
import BeIcon from '../assets/img/Cloud.png';
import FeelIcon from '../assets/img/Heart.png';
import ConcernIcon from '../assets/img/Risk.png';

import React, { useState } from 'react';
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

const ModelInput: React.FC = () => {
  // State for the active tab
  const [activeKey, setActiveKey] = useState<string>(tabs[0].label);
  // State to keep track of all data associated with tabs
  const [tabData, setTabData] = useState<TabContent[]>(tabs.map(tab => ({ ...tab, rows: [''] })));

  // Function to handle selecting a tab
  const handleSelect = (selectedKey: string) => {
    setActiveKey(selectedKey);
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

  // Get the last row of the active tab
  const activeTab = tabData.find(tab => tab.label === activeKey);
  // Check if the last row is not empty (it also checks if activeTab is defined)
  const canAddRow = activeTab && activeTab.rows[activeTab.rows.length - 1] !== '';

  return (
    <div className={styles.tabContainer}>
      <Tab.Container activeKey={activeKey} onSelect={handleSelect}>
        <Nav variant="pills" className="flex-row">
          {tabData.map(tab => (
            <Nav.Item key={tab.label} className={styles.navItem}>
              <Nav.Link
                eventKey={tab.label}
                className={`${styles.navLink} ${activeKey === tab.label ? 'active' : ''}`}
              >
                <img src={tab.icon} alt={`${tab.label} icon`} className={styles.icon} />
                <span className={styles.labelBelowIcon}>{tab.label}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        <Tab.Content className={styles.contentArea}>
          {tabData.map(tab => (
            <Tab.Pane key={tab.label} eventKey={tab.label}>
              {/* <h4>{tab.label}</h4> */}
              {tab.rows.map((row, index) => (
                <Form.Group key={`${tab.label}-${index}`} as={Row} className={styles.formGroup}>
                  <Col sm={12}>
                    <Form.Control
                      type="text"
                      value={row}
                      onChange={e => handleRowChange(tab.label, index, e.target.value)}
                      placeholder={`Enter ${tab.label}...`}
                      spellCheck // Browser's spellcheck feature
                      className="bg-white" // White background for input row
                    />
                  </Col>
                </Form.Group>
              ))}
              {canAddRow && (
                <Button 
                    variant="outline-secondary" // Changed to 'outline-secondary' for the light grey background
                    onClick={() => handleAddRow(activeKey)}
                    className={styles.addButton}
                >
                  Add
                </Button>
              )}
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

export default ModelInput;
