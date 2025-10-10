import React from "react";
import {ButtonGroup, Dropdown, DropdownButton} from "react-bootstrap";
import {createDefaultTabData, defaultTreeData} from "../../data/initialTabs";
import {useFileContext} from "../context/FileProvider";
import {reset} from "../context/treeDataSlice";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark" | "outline-primary" | "outline-secondary" | "outline-success" | "outline-danger" | "outline-warning" | "outline-info" | "outline-light" | "outline-dark" | "link";

type ResetGraphProps = {
    variant?: ButtonVariant
    className?: string
}

const ResetGraphButton: React.FC<ResetGraphProps>  = ({variant="", className=""}) => {
	const {dispatch} = useFileContext();

    return (
        <DropdownButton as={ButtonGroup} title="Reset" variant={variant} className={className}>
            <Dropdown.Item onClick={() => dispatch(reset())}>Empty</Dropdown.Item>
            <Dropdown.Item onClick={() => dispatch(reset({
                                              treeData: defaultTreeData,
                                              tabData: createDefaultTabData()
                                          }))}>
                Default
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default ResetGraphButton;