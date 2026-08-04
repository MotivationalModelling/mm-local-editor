import React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import ExportFileButton from "./ExportFileButton";
import ResetGraphButton from "../Graphs/ResetGraphButton.tsx";

import GenerateUserStoriesButton from "./GenerateUserStoriesButton.tsx";
import HomeButton from "./HomeButton.tsx";

type ProjectEditHeaderProps = {
	// Add showGraphSection prop to control Export button enablement
	showGraphSection: boolean;
};

const ProjectEditHeader: React.FC<ProjectEditHeaderProps> = ({
	showGraphSection,
  }) => {
	return (
		<header className="w-full sticky top-0 z-10 border-b bg-white shadow-sm">
            <Container fluid>
                <Row className="text-start align-content-start">
                    <Col xs="auto" className="d-flex align-items-center">
                        <strong style={{fontSize: "35px"}}>AMMBER</strong>
                        <ResetGraphButton variant="outline-primary" className="ms-3"/>
                    </Col>
                    <Col className="d-flex justify-content-end align-items-center">
                        <div className="d-flex gap-2 align-items-center">
                            <GenerateUserStoriesButton/>
                            <ExportFileButton showGraphSection={showGraphSection}/>
                            <HomeButton/>
                        </div>
                    </Col>
                </Row>
            </Container>
        </header>
	);
};

export default ProjectEditHeader;
