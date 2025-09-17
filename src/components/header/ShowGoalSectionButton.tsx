import Button from "react-bootstrap/Button";

interface ShowGoalSectionButtonProps {
    onClick: () => void
    showGoalSection: boolean
    className?: string
}

const ShowGoalSectionButton = ({onClick, showGoalSection, className}: ShowGoalSectionButtonProps) => (
    <Button variant="outline-primary"
            onClick={onClick}
            className={className}>
        {(showGoalSection) ? "Hide Goal List" : "Show Goal List"}
    </Button>
);

export default ShowGoalSectionButton;