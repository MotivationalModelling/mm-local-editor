import Button, {ButtonProps} from "react-bootstrap/Button";
import {ButtonVariant} from "react-bootstrap/types";
import {MouseEventHandler} from "react";

interface ShowGoalSectionButtonProps {
    onClick: MouseEventHandler
    showGoalSection: boolean
    className?: string
    size?: "xs" | ButtonProps["size"]
    variant?: ButtonVariant
}

type SizeAndStyle = Record<"size", ButtonProps["size"]> | Record<"style", Record<string, string>>

const ShowGoalSectionButton = ({onClick, showGoalSection, className, variant="outline-primary", size}: ShowGoalSectionButtonProps) => {
    const sizeAndStyle: SizeAndStyle = (size === "xs") ? {
        size: "sm",
        style: {
            "--bs-btn-padding-y": ".0rem",
            "--bs-btn-padding-x": ".5rem",
            "--bs-btn-font-size": ".7rem"
        }
    } : {
        size
    };

    return (
        <Button variant={variant}
                onClick={onClick}
                className={className}
                {...sizeAndStyle}>
            {(showGoalSection) ? "Hide goal list" : "Show goal list"}
        </Button>
    );
};

export default ShowGoalSectionButton;