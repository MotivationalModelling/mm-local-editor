import Button from "react-bootstrap/Button";
import {ButtonVariant} from "react-bootstrap/types";
import {MouseEventHandler} from "react";

interface ShowGoalSectionButtonProps {
    onClick: MouseEventHandler
    showGoalSection: boolean
    className?: string
    size?: "sm" | "lg"
    variant?: ButtonVariant
}

const ShowGoalSectionButton = ({onClick, showGoalSection, className, variant="outline-primary", size}: ShowGoalSectionButtonProps) => (
    <Button variant={variant}
            onClick={onClick}
            className={className}
            size={size}>
        {(showGoalSection) ? "Hide goal list" : "Show goal list"}
    </Button>
);

export default ShowGoalSectionButton;