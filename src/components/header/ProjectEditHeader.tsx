/**
 * ProjectEditHeader Component
 *
 * This component renders the header for the project edit page.
 * It includes:
 * - Project title
 * - Buttons to toggle goal list visibility
 * - Graph reset button
 * - Export and Save file buttons (Save enabled only for supported browsers)
 * - Back button to reset data and navigate to home
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Container, Row, Button, ButtonGroup } from "react-bootstrap";

import SaveFileButton from "./SaveFileButton";
import ExportFileButton from "./ExportFileButton";
import { useFileContext } from "../context/FileProvider";
import { isChrome, isOpera, isEdge } from "react-device-detect";
import { reset } from "../context/treeDataSlice.ts";
import { initialTabs } from "../../data/initialTabs.ts";
import ResetGraphButton from "../Graphs/ResetGraphButton.tsx";

/**
 * Props for ProjectEditHeader component
 *
 * @property showGoalSection - Controls visibility of the goal list section
 * @property setShowGoalSection - Function to toggle showGoalSection state
 * @property showGraphSection - Controls whether Export button is enabled
 */
type ProjectEditHeaderProps = {
  showGoalSection: boolean;
  setShowGoalSection: (showGoalSection: boolean) => void;
  showGraphSection: boolean;
};

const ProjectEditHeader: React.FC<ProjectEditHeaderProps> = ({
  showGoalSection,
  setShowGoalSection,
  showGraphSection,
}) => {
  const { dispatch } = useFileContext(); // Access global file context
  const navigate = useNavigate(); // React Router navigation
  const [isBrowserSupported, setIsBrowserSupported] = useState(false); // Flag for browser support for SaveFileButton

  useEffect(() => {
    // Check if current browser supports save functionality (Chrome, Edge, Opera)
    if (isChrome || isEdge || isOpera) {
      setIsBrowserSupported(true);
    }
  }, []);

  /**
   * Handle back button click
   * - Reset project tabs and tree data to initial state
   * - Navigate back to home page
   */
  const handleBackBtnClick = () => {
    dispatch(reset({ tabData: initialTabs, treeData: [] }));
    navigate("/", { replace: true });
  };

  return (
    <header className="w-full sticky top-0 z-10 border-b bg-white shadow-sm">
      <Container fluid>
        <Row className="text-start align-content-start">
          <Col xs="auto">
            <strong style={{ fontSize: "35px" }}>AMMBER</strong>
          </Col>
          <Col className="d-flex flex-column flex-md-row gap-2 justify-content-end align-items-end">
            <Button
              variant="outline-primary"
              onClick={() => setShowGoalSection(!showGoalSection)}
            >
              {showGoalSection ? "Hide Goal List" : "Show Goal List"}
            </Button>
            <ResetGraphButton variant="outline-primary" className="ms-3" />
            <ButtonGroup className="ms-3">
              {/* Pass showGraphSection to ExportFileButton to control enablement */}
              <ExportFileButton showGraphSection={showGraphSection} />
              {isBrowserSupported && <SaveFileButton />}
            </ButtonGroup>
            <Button
              variant="outline-primary"
              onClick={handleBackBtnClick}
              className="ms-3"
            >
              Back
            </Button>
          </Col>
          {/* <Col className="text-end align-content-center" xs={8}>
						<ButtonGroup>
							<ExportFileButton />
							{isBrowserSupported && <SaveFileButton />}
						</ButtonGroup>
						
					</Col>		 */}
          {/* <Col className="text-end align-content-center">
						<Button variant="primary" onClick={handleBackBtnClick}>
							Back
						</Button>
					</Col> */}
        </Row>
      </Container>
    </header>
  );
};

export default ProjectEditHeader;
