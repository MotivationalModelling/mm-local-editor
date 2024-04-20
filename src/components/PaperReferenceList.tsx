import React from "react";

import {Link} from "react-router-dom";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import "./PaperReferenceList.css"

export interface Reference {
    title: string
    link: string
    summary?: string
}

const PaperReference: React.FC<{paper: Reference}> = ({paper}) => {
    return (
        <Card>
            <Card.Header as="h5">
                {paper.title}
            </Card.Header>
            <Card.Body>
                {(paper.summary) && (
                    <Card.Text>
                        {paper.summary}
                    </Card.Text>
                )}
            </Card.Body>
            <Card.Footer>
                <Link to={paper.link} target="_blank">
                    View
                </Link>
            </Card.Footer>
        </Card>
    );
};

interface Props {
    references: Reference[]
}

const PaperReferenceList: React.FC<Props> = ({references}) => {
    return (
        <ListGroup as="ul" variant="flush">
            {references.map((paper, i) => (
                <ListGroup.Item as="li" key={i} style={{background: "transparent", border: "none"}}>
                    <PaperReference paper={paper} key={i}/>
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
};

export default PaperReferenceList;
