import React from "react";

import { Link } from "react-router-dom";

import { Col } from "react-bootstrap";
import { Container } from "react-bootstrap";
import { Row } from "react-bootstrap";
import { Button } from "react-bootstrap";
import SaveFileButton from "./SaveFileButton";
import ExportFileButton from "./ExportFileButton";

const ProjectEditHeader: React.FC = () => {
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
							<Button variant="primary">Back</Button>
						</Link>
					</Col>
				</Row>
			</Container>
		</header>
	);
};

export default ProjectEditHeader;
