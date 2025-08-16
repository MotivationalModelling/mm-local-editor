import {Graph} from "@maxgraph/core";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import {BsStopCircle, BsZoomIn, BsZoomOut} from "react-icons/bs";

type ZoomButtonsProps = {
  graph: Graph;
  recentreView: () => void;
};

const ZoomButtons = ({graph, recentreView}: ZoomButtonsProps) => {
    return (
        <ButtonGroup className="w-100" size="sm">
            <Button variant="light"
                    onClick={() => graph.zoomIn()}>
                <BsZoomIn/>
            </Button>
            <Button variant="light"
                    onClick={() => recentreView()}>
                <BsStopCircle/>
            </Button>
            <Button variant="light"
                    onClick={() => graph.zoomOut()}>
                <BsZoomOut/>
            </Button>
        </ButtonGroup>
    )
};

export default ZoomButtons;