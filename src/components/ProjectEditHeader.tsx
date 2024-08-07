import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { Col } from "react-bootstrap";
import { Container } from "react-bootstrap";
import { Row } from "react-bootstrap";
import { Button } from "react-bootstrap";
import SaveFileButton from "./SaveFileButton";
import ExportFileButton from "./ExportFileButton";
import { useFileContext } from "./context/FileProvider";
import { isChrome, isOpera, isEdge } from "react-device-detect";

const ProjectEditHeader: React.FC = () => {
	const { resetData } = useFileContext();
	const navigate = useNavigate();
	const [isBrowserSupported, setIsBrowserSupported] = useState(false);

	useEffect(() => {
		if (isChrome || isEdge || isOpera) {
			setIsBrowserSupported(true);
		}
	}, []);

	const handleBackBtnClick = () => {
		resetData();
		navigate("/", { replace: true });
	};

	return (
		<header
			className="bg-white mb-2 py-3 px-5 overflow-hidden"
			style={{ width: "auto", minWidth: "1280px", maxWidth: "100%" }}
		>
			<Container fluid>
				<Row className="text-start align-content-center">
					<Col>
						<strong style={{ fontSize: "35px" }}>AMMBER</strong>
					</Col>
					<Col className="text-end align-content-center" xs={8}>
						<ExportFileButton />
						{isBrowserSupported && <SaveFileButton />}
					</Col>
					<Col className="text-end align-content-center">
						<Button variant="primary" onClick={handleBackBtnClick}>
							Back
						</Button>
					</Col>
				</Row>
			</Container>
		</header>
	);
};

export default ProjectEditHeader;
