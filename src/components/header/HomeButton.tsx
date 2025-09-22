import Button from "react-bootstrap/Button";
import {useNavigate} from "react-router-dom";

interface HomeButtonProps {
    className?: string
}

const HomeButton = ({className}: HomeButtonProps) => {
	const navigate = useNavigate();

    return (
        <Button variant="outline-primary"
                onClick={() => navigate("/", {replace: true})}
                className={className}>
            Home
        </Button>
    );
};

export default HomeButton;