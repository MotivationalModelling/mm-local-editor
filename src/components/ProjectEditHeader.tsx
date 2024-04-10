import React from "react";
import { Col, Container, Row, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const ProjectEditHeader = () => {
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
          <Col className="text-end align-content-center">
            <Link to={"/"}>
              <Button variant="warning">Return</Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </header>
  );
};

export default ProjectEditHeader;
