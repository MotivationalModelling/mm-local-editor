import React, {useEffect, useState} from "react";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import SaveFileButton from "./SaveFileButton";
import ExportFileButton from "./ExportFileButton";
import {isChrome, isEdge, isOpera} from "react-device-detect";
import ResetGraphButton from "../Graphs/ResetGraphButton.tsx";

import HomeButton from "./HomeButton.tsx";
import {useProjectContext} from "../context/ProjectContext";

type ProjectEditHeaderProps = {
	showGoalSection: boolean;
	setShowGoalSection: (showGoalSection: boolean) => void;
	// Add showGraphSection prop to control Export button enablement
	showGraphSection: boolean;
};

const ProjectEditHeader: React.FC<ProjectEditHeaderProps> = ({
	showGraphSection,
  }) => {
	const [isBrowserSupported, setIsBrowserSupported] = useState(false);
	const {currentProject, renameProject} = useProjectContext();
	const [isEditingName, setIsEditingName] = useState(false);
	const [nameDraft, setNameDraft] = useState("");
  
	useEffect(() => {
		if (isChrome || isEdge || isOpera) {
			setIsBrowserSupported(true);
		}
	}, []);
  
	return (
		<header className="projectEditHeader w-full sticky top-0 z-10 border-b bg-white shadow-sm">
            <Container fluid>
                <Row className="text-start align-content-start">
                    <Col xs="auto" className="d-flex align-items-center">
                        {isEditingName ? (
                            <input
                                autoFocus
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                onBlur={() => {
                                    const name = nameDraft.trim();
                                    if (name && currentProject) {
                                        renameProject(currentProject.id, name);
                                    }
                                    setIsEditingName(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                    } else if (e.key === "Escape") {
                                        setIsEditingName(false);
                                    }
                                }}
                                style={{fontSize: "28px", fontWeight: "bold", maxWidth: "40vw"}}
                            />
                        ) : (
                            <strong
                                style={{fontSize: "35px", cursor: "pointer"}}
                                title="Click to rename"
                                onClick={() => {
                                    setNameDraft(currentProject?.name ?? "AMMBER");
                                    setIsEditingName(true);
                                }}
                            >
                                {currentProject?.name ?? "AMMBER"}
                            </strong>
                        )}
                        <ResetGraphButton variant="outline-primary" className="ms-3"/>
                    </Col>
                    <Col className="d-flex flex-column flex-sm-row gap-2 justify-content-end align-items-center">
                        <ButtonGroup>
                            {/* Pass showGraphSection to ExportFileButton to control enablement */}
                            <ExportFileButton showGraphSection={showGraphSection}/>
                            {isBrowserSupported && <SaveFileButton/>}
                        </ButtonGroup>
                        <HomeButton/>
                    </Col>
                </Row>
            </Container>
        </header>
	);
};

export default ProjectEditHeader;
