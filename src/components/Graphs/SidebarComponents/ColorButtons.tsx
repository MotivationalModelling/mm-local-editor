import {useState} from "react";
import {Graph} from "@maxgraph/core";
import {ColorResult} from "react-color";

import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ColorPicker from "./ColorPicker.tsx";
import {useFileContext} from "../../context/FileProvider.tsx";
import {parseGoalRefId} from "../../utils/GraphUtils.tsx";
import {updateColorForInstanceId} from "../../context/treeDataSlice.ts";

type ColorButtonsProps = {
    graph: Graph;
};

const ColorButtons = ({graph}: ColorButtonsProps) => {
    const [selectedColor, setSelectedColor] = useState<string>("#ffffff");
    const {dispatch} = useFileContext();
    const setColor = (color: string) => {
        graph.getDataModel().beginUpdate();
        try {
            graph.getSelectionCells().forEach((cell) => {           
                const id = cell.getId();
                const instanceId = parseGoalRefId(id!)?.[0].instanceId;
                if (instanceId) {
                    dispatch(updateColorForInstanceId({instanceId, color}));
                }
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
            <ButtonGroup size="sm" className="d-flex justify-content-center" aria-label="Priority colour">
                <Button variant="danger"
                        className="flex-grow-0"
                        title="High priority"
                        aria-label="High priority colour"
                        onClick={() => setColor("#DB3545")}>
                    H
                </Button>
                <Button variant="warning"
                        className="flex-grow-0"
                        title="Medium priority"
                        aria-label="Medium priority colour"
                        onClick={() => setColor("#FFC107")}>
                    M
                </Button>
                <Button variant="success"
                        className="flex-grow-0"
                        title="Low priority"
                        aria-label="Low priority colour"
                        onClick={() => setColor("#198754")}>
                    L
                </Button>
            </ButtonGroup>
            <ColorPicker selectedColor={selectedColor}
                         onColorChange={updateSelectedColor}
                         className="pt-1"/>
        </>
    )
};

export default ColorButtons;
