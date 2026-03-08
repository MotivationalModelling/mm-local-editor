import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import {BsStopCircle, BsZoomIn, BsZoomOut} from "react-icons/bs";
import {useGraph} from "../../context/GraphContext.tsx";

type ZoomButtonsProps = {
  recentreView: () => void
};

const ZoomButtons = ({recentreView}: ZoomButtonsProps) => {
    const {graph} = useGraph();

    return (
        <ButtonGroup className="w-100 d-flex flex-wrap" size="sm">
            <Button className="flex-fill"
                    variant="light"
                    size="sm"
                    onClick={() => graph?.zoomIn()}>
                <BsZoomIn/>
            </Button>
            <Button className="flex-fill"
                    variant="light"
                    size="sm"
                    onClick={() => recentreView()}>
                <BsStopCircle/>
            </Button>
            <Button className="flex-fill"
                    variant="light"
                    size="sm"
                    onClick={() => graph?.zoomOut()}>
                <BsZoomOut/>
            </Button>
        </ButtonGroup>
    )
};

export default ZoomButtons;