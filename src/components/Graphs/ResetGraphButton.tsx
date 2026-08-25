import React from "react";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import {useFileContext} from "../context/FileProvider";
import {reset} from "../context/treeDataSlice";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark" | "outline-primary" | "outline-secondary" | "outline-success" | "outline-danger" | "outline-warning" | "outline-info" | "outline-light" | "outline-dark" | "link";

type ResetGraphProps = {
    variant?: ButtonVariant
    className?: string
}

const ResetGraphButton: React.FC<ResetGraphProps>  = ({variant="", className=""}) => {
    const {dispatch, loadDefaultModel, saveCurrentModelAsDefault} = useFileContext();

    return (
        <DropdownButton as={ButtonGroup} title="Reset" variant={variant} className={className}>
            <Dropdown.Item onClick={() => dispatch(reset())}>Empty</Dropdown.Item>
            <Dropdown.Item onClick={loadDefaultModel}>Default</Dropdown.Item>
            <Dropdown.Divider/>
            <Dropdown.Item onClick={saveCurrentModelAsDefault}>Save as Default</Dropdown.Item>
        </DropdownButton>
    );
};

export default ResetGraphButton;
