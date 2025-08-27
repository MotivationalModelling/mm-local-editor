import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import {ButtonVariant} from "react-bootstrap/types";
import {reset} from "../context/treeDataSlice.ts";
import {initialTabs} from "../../data/initialTabs.ts";
import {useFileContext} from "../context/FileProvider.tsx";
import ButtonGroup from "react-bootstrap/ButtonGroup";

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
                                              treeData: [],
                                              tabData: initialTabs
                                          }))}>
                Default
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default ResetGraphButton;