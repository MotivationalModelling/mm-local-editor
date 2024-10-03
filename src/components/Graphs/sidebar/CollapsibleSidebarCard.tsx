import React, {useState} from "react";
import Card from "react-bootstrap/Card";
import {BsCaretDownFill, BsCaretRightFill} from "react-icons/bs";
import Collapse from "react-bootstrap/Collapse";

interface Props {
    title: string
    children: React.ReactNode
}

export const CollapsibleSidebarCard = ({title, children}: Props) => {
    const [showCardContent, setShowCardContent] = useState(false);

    return (
        <Card>
            <Card.Body className="p-1">
                <Card.Subtitle onClick={() => setShowCardContent(!showCardContent)}>
                    {(showCardContent) ? <BsCaretDownFill/> : <BsCaretRightFill/>}
                    {title}
                </Card.Subtitle>
                <Collapse in={showCardContent}>
                    <Card.Text className="border p-1">
                        {children}
                    </Card.Text>
                </Collapse>
            </Card.Body>
        </Card>
    );
};