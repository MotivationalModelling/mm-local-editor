import React from "react";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import {createDefaultTabData, defaultTreeData} from "../../data/initialTabs";
import {defaultFeedbacks, defaultOverallFeedback} from "../../data/defaultFeedback";
import {useFileContext} from "../context/FileProvider";
import {reset} from "../context/treeDataSlice";
import {useFeedbackContext} from "../context/FeedbackContext";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark" | "outline-primary" | "outline-secondary" | "outline-success" | "outline-danger" | "outline-warning" | "outline-info" | "outline-light" | "outline-dark" | "link";

type ResetGraphProps = {
    variant?: ButtonVariant
    className?: string
}

const ResetGraphButton: React.FC<ResetGraphProps>  = ({variant="", className=""}) => {
	const {dispatch} = useFileContext();
	const {resetFeedbacks} = useFeedbackContext();

    return (
        <DropdownButton as={ButtonGroup} title="Reset" variant={variant} className={className}>
            <Dropdown.Item onClick={() => {dispatch(reset()); resetFeedbacks();}}>Empty</Dropdown.Item>
            <Dropdown.Item onClick={() => {dispatch(reset({
                                              treeData: defaultTreeData,
                                              tabData: createDefaultTabData()
                                          })); resetFeedbacks(defaultFeedbacks, defaultOverallFeedback);}}>
                Default
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default ResetGraphButton;
