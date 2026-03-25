import React, {useState} from "react";
import Card from "react-bootstrap/Card";
import {BsCaretDownFill, BsCaretRightFill} from "react-icons/bs";
import Collapse from "react-bootstrap/Collapse";

interface Props {
    title: string
    isOpen?: boolean
    children: React.ReactNode
}

export const CollapsibleSidebarCard = ({title, isOpen=false, children}: Props) => {
    const [showCardContent, setShowCardContent] = useState(isOpen);

    return (
        <Card>
            <Card.Body className="p-1">
                <Card.Subtitle onClick={() => setShowCardContent(!showCardContent)}
                               style={{cursor: "pointer"}}>
                    {showCardContent ? <BsCaretDownFill/> : <BsCaretRightFill/>}
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
