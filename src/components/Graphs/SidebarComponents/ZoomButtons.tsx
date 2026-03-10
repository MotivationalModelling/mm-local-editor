import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import {BsStopCircle, BsZoomIn, BsZoomOut} from "react-icons/bs";
import {useGraph} from "../../context/GraphContext.tsx";
import { useEffect, useRef, useState } from "react";

type ZoomButtonsProps = {
  recentreView: () => void
};

const ZoomButtons = ({recentreView}: ZoomButtonsProps) => {
    const {graph} = useGraph();
    const HORIZONTAL_THRESHOLD = 90; 
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
  
    useEffect(() => {
        const container = containerRef.current;

        if (container) {
            const resizeObserver = new ResizeObserver(() => {
                setContainerWidth(container.offsetWidth);
            });
            resizeObserver.observe(container);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, []);

    return (
        <ButtonGroup ref={containerRef} 
                    className={`w-100 d-flex ${containerWidth < HORIZONTAL_THRESHOLD ? "flex-column" : "flex-row"}`} 
                    size="sm">
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