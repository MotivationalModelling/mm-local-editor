import {Graph, PanningHandler, RubberBandHandler} from "@maxgraph/core";
import {useEffect, useState} from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {BsBoundingBoxCircles, BsHandIndex} from "react-icons/bs";
import {useGraph} from "../../context/GraphContext.tsx";

type CanvasMode = "pan" | "select";

const applyCanvasMode = (graph: Graph, canvasMode: CanvasMode) => {
    const panningHandler = graph.getPlugin<PanningHandler>(PanningHandler.pluginId);
    const rubberBandHandler = graph.getPlugin<RubberBandHandler>(RubberBandHandler.pluginId);

    if (panningHandler) {
        panningHandler.useLeftButtonForPanning = canvasMode === "pan";
    }
    rubberBandHandler?.setEnabled(canvasMode === "select");
    graph.container.classList.toggle("canvas-select-mode", canvasMode === "select");
};

const SelectionMode = () => {
    const {graph} = useGraph();
    const [canvasMode, setCanvasMode] = useState<CanvasMode>("pan");

    useEffect(() => {
        if (graph) {
            applyCanvasMode(graph, canvasMode);
        }
    }, [canvasMode, graph]);

    return (
        <ButtonGroup className="w-100" size="sm" aria-label="Canvas interaction mode">
            <Button
                className="flex-fill"
                variant={canvasMode === "select" ? "primary" : "light"}
                aria-label="Select goals"
                title="Select goals"
                aria-pressed={canvasMode === "select"}
                onClick={() => setCanvasMode("select")}
            >
                <BsBoundingBoxCircles/>
            </Button>
            <Button
                className="flex-fill"
                variant={canvasMode === "pan" ? "primary" : "light"}
                aria-label="Pan canvas"
                title="Pan canvas"
                aria-pressed={canvasMode === "pan"}
                onClick={() => setCanvasMode("pan")}
            >
                <BsHandIndex/>
            </Button>
        </ButtonGroup>
    );
};

export default SelectionMode;
