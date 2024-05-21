import React from "react";

import { Link } from "react-router-dom";

import { Col } from "react-bootstrap";
import { Container } from "react-bootstrap";
import { Row } from "react-bootstrap";
import { Button } from "react-bootstrap";
import SaveFileButton from "./SaveFileButton";
import ExportFileButton from "./ExportFileButton";
import { del } from "idb-keyval";
import { DataType, useFileContext } from "./context/FileProvider";

const ProjectEditHeader: React.FC = () => {
	const { setJsonFileHandle, setTreeData, setTabData } = useFileContext();

	const handleBackBtnClick = () => {
		setJsonFileHandle(null);
		del(DataType.JSON);
		setTabData([]);
		setTreeData([]);
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
						<SaveFileButton />
					</Col>
					<Col className="text-end align-content-center">
						<Link to="/">
							<Button variant="primary" onClick={handleBackBtnClick}>
								Back
							</Button>
						</Link>
					</Col>
				</Row>
			</Container>
		</header>
	);
};

export default ProjectEditHeader;
