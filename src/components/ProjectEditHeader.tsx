import React from "react";
import { Col, Container, Row } from "react-bootstrap";

const ProjectEditHeader = () => {
  return (
    <header
      className="bg-white mb-2 py-3 overflow-hidden"
      style={{ width: "auto", minWidth: "1280px", maxWidth: "100%" }}
    >
      <Container fluid>
        <Row>
          <Col>
            &nbsp;&nbsp;&nbsp;
            <strong style={{ fontSize: "35px" }}>Motivational Model</strong>
          </Col>
        </Row>
      </Container>
    </header>
  );
};

export default ProjectEditHeader;
