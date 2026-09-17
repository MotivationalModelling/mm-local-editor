import React from "react";
import {Link} from "react-router-dom";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import {Paper} from "../data/papers";
import "./PaperReferenceList.css";

const PaperReference: React.FC<{paper: Paper}> = ({paper}) => {
    return (
        <Card>
            <Card.Header as="h5">
                {paper.title}
            </Card.Header>
            <Card.Body>
                <Card.Subtitle className="mb-2 text-muted">
                    {paper.authors} ({paper.year})
                </Card.Subtitle>
                {paper.description && (
                    <Card.Text>
                        {paper.description}
                    </Card.Text>
                )}
            </Card.Body>
            <Card.Footer>
                {paper.link ? (
                    <Link to={paper.link} target="_blank" rel="noopener noreferrer">
                        View
                    </Link>
                ) : (
                    <span className="text-muted">Coming soon</span>
                )}
            </Card.Footer>
        </Card>
    );
};

interface Props {
    references: Paper[];
}

const PaperReferenceList: React.FC<Props> = ({references}) => {
    return (
        <ListGroup as="ul" variant="flush" className="paper-reference-list">
            {references.map((paper) => (
                <ListGroup.Item
                    as="li"
                    key={paper.id}
                    style={{background: "transparent", border: "none"}}
                >
                    <PaperReference paper={paper}/>
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
};

export default PaperReferenceList;