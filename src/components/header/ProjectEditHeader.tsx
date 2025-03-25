import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Container, Row, Button, ButtonGroup } from "react-bootstrap";

import SaveFileButton from "./SaveFileButton";
import ExportFileButton from "./ExportFileButton";
import { useFileContext } from "../context/FileProvider";
import { isChrome, isOpera, isEdge } from "react-device-detect";
import {reset} from "../context/treeDataSlice.ts";
import {initialTabs} from "../../data/initialTabs.ts";

type ProjectEditHeaderProps = {
	showGoalSection: boolean;
	setShowGoalSection: (showGoalSection: boolean) => void;
};


const ProjectEditHeader: React.FC<ProjectEditHeaderProps> = ({
	showGoalSection,
	setShowGoalSection,
  }) => {
	const {dispatch} = useFileContext();
	const navigate = useNavigate();
	const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  
	useEffect(() => {
		if (isChrome || isEdge || isOpera) {
			setIsBrowserSupported(true);
		}
	}, []);
  
	const handleBackBtnClick = () => {
		dispatch(reset({tabContent: initialTabs, treeData: []}));
		navigate("/", { replace: true });
	};

	return (
		<header className="mb-2 py-3 px-5"
				style={{width: "auto", minWidth: "1280px", maxWidth: "100%"}}>
			<Container fluid>
				<Row className="text-start align-content-center">
					<Col>
						<strong style={{ fontSize: "35px" }}>AMMBER</strong>
					</Col>
					<Col className="text-end align-content-center">
						<Button variant="outline-primary" onClick={() => setShowGoalSection(!showGoalSection)}>
							{showGoalSection ? "Hide Goal List" : "Show Goal List"}
						</Button>
						<ButtonGroup className="ms-3">
							<ExportFileButton />
							{isBrowserSupported && <SaveFileButton />}
						</ButtonGroup>
						<Button variant="outline-primary" onClick={handleBackBtnClick} className="ms-3">
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
