import {Graph} from "@maxgraph/core";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {BsBoundingBoxCircles, BsHandIndex} from "react-icons/bs";
import ColorButtons from "./ColorButtons";
import LineButtons from "./LineButtons";
import ZoomButtons from "./ZoomButtons";
import ScaleTextButton from "../ScaleTextButton";
import {CollapsibleSidebarCard} from "./CollapsibleSidebarCard";

export type CanvasMode = "pan" | "select";

interface SidebarProps {
    graph: Graph | null
    recentreView: () => void
    canvasMode: CanvasMode
    onCanvasModeChange: (mode: CanvasMode) => void
    className?: string
}

const SidebarBody = ({graph, recentreView, canvasMode, onCanvasModeChange, className}: SidebarProps) => {
    if (!graph) return null;

    return (
        <div className={`border border-black p-1 rounded ${className}`}>
            <CollapsibleSidebarCard isOpen title="Selection">
                <ButtonGroup className="w-100" size="sm" aria-label="Canvas interaction mode">
                    <Button
                        className="flex-fill"
                        variant={canvasMode === "select" ? "primary" : "light"}
                        aria-label="Select goals"
                        title="Select goals"
                        aria-pressed={canvasMode === "select"}
                        onClick={() => onCanvasModeChange("select")}
                    >
                        <BsBoundingBoxCircles/>
                    </Button>
                    <Button
                        className="flex-fill"
                        variant={canvasMode === "pan" ? "primary" : "light"}
                        aria-label="Pan canvas"
                        title="Pan canvas"
                        aria-pressed={canvasMode === "pan"}
                        onClick={() => onCanvasModeChange("pan")}
                    >
                        <BsHandIndex/>
                    </Button>
                </ButtonGroup>
            </CollapsibleSidebarCard>
            <CollapsibleSidebarCard isOpen title="Zoom">
                <ZoomButtons recentreView={recentreView}/>
            </CollapsibleSidebarCard>
            <CollapsibleSidebarCard title="Colour">
                <ColorButtons graph={graph}/>
            </CollapsibleSidebarCard>
            <CollapsibleSidebarCard title="Font size">
                <ScaleTextButton/>
            </CollapsibleSidebarCard>
            <CollapsibleSidebarCard title="Line visibility">
                <LineButtons/>
            </CollapsibleSidebarCard>
        </div>
    );
};

export default SidebarBody;
