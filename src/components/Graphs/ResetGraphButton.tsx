import React from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";

type ResetGraphProps = {
    resetEmptyGraph: () => void;
    resetDefaultGraph: () => void;
};

const ResetGraphButton: React.FC<ResetGraphProps>  = ({ resetEmptyGraph, resetDefaultGraph }) => {
    return (
        <DropdownButton id="dropdown-basic-button" title="Reset">
            <Dropdown.Item onClick={resetEmptyGraph}>Empty</Dropdown.Item>
            <Dropdown.Item onClick={resetDefaultGraph}>Default</Dropdown.Item>
        </DropdownButton>
    );
};

export default ResetGraphButton;