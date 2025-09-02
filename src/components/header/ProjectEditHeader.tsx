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

type ProjectEditHeaderProps = {
  showGoalSection: boolean;
  setShowGoalSection: (showGoalSection: boolean) => void;
  // Add showGraphSection prop to control Export button enablement
  showGraphSection: boolean;
};

const ProjectEditHeader: React.FC<ProjectEditHeaderProps> = ({
  showGoalSection,
  setShowGoalSection,
  showGraphSection,
}) => {
  const { dispatch } = useFileContext();
  const navigate = useNavigate();
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);

  useEffect(() => {
    if (isChrome || isEdge || isOpera) {
      setIsBrowserSupported(true);
    }
  }, []);

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
