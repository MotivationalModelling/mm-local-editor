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
                <Collapse in={showCardContent} timeout={350}>
                    {/* Keep padding and borders off the element whose height Collapse animates. This is mentioned
                    in the React Bootstrap docs: https://react-bootstrap.github.io/docs/utilities/transitions/ */}
                    <div>
                        <Card.Text as="div" className="border p-1">
                            {children}
                        </Card.Text>
                    </div>
                </Collapse>
            </Card.Body>
        </Card>
    );
};
