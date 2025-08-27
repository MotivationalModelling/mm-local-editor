import {useState} from "react";
import {Graph} from "@maxgraph/core";
import {ColorResult} from "react-color";

import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import ColorPicker from "./ColorPicker.tsx";

type ColorButtonsProps = {
    graph: Graph;
};

const ColorButtons = ({graph}: ColorButtonsProps) => {
    const [selectedColor, setSelectedColor] = useState<string>("#ffffff");
    const setColor = (color: string) => {
        graph.getDataModel().beginUpdate();
        try {
            graph.getSelectionCells().forEach((cell) => {
                const style = graph.getCellStyle(cell);
                style.fillColor = color;
                graph.getDataModel().setStyle(cell, style);
            });
        } finally {
            graph.getDataModel().endUpdate();
        }
    };

    const updateSelectedColor = (color: ColorResult) => {
        setSelectedColor(color.hex);
        setColor(color.hex)
    };

    // Note that the colours are copies from the bootstrap variants and won't track changes there
    return (
        <>
            <ButtonGroup vertical className="w-100">
                <Button variant="danger"
                        onClick={() => setColor("#DB3545")}>
                    High
                </Button>
                <Button variant="warning"
                        onClick={() => setColor("#FFC107")}>
                    Medium
                </Button>
                <Button variant="success"
                        onClick={() => setColor("#198754")}>
                    Low
                </Button>
            </ButtonGroup>
            <ColorPicker selectedColor={selectedColor}
                         onColorChange={updateSelectedColor}
                         className="pt-1"/>
        </>
    )
};

export default ColorButtons;