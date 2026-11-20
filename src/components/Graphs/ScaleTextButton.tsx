import {useState, useEffect, useId} from "react";
import FormControl from "react-bootstrap/FormControl";
import {getGeometryToFitLabel, scaleGeometryAroundCentre} from "./GraphFontFit";
import {FONT_SIZE_LIMITS, isWhoCell} from "./GraphLabelUtils";
import {CellEditorHandler} from "@maxgraph/core";
import {useGraph} from "../context/GraphContext";

const ScaleTextButton = () => {
    const {graph} = useGraph();
    const [fontSize, setFontSize] = useState(12);
    const fontSizeHintId = useId();

    useEffect(() => {
        if (!graph) return;

        // Keep the control in sync with selection changes and undo.
        const updateFontSize = () => {
            const cells = graph.getSelectionCells();
            if (cells.length > 0) {
                const style = graph.getCellStyle(cells[0]);
                const currentFontSize = style.fontSize || 12;
                setFontSize(currentFontSize);
            }
        };

        graph.getSelectionModel().addListener("change", updateFontSize);
        graph.getDataModel().addListener("change", updateFontSize);

        // Cleanup the listener when the component unmounts
        return () => {
            graph.getSelectionModel().removeListener(updateFontSize);
            graph.getDataModel().removeListener(updateFontSize);
        };
    }, [graph]);


    // Function to handle input changes for font size - update vertices font sizes
    const handleFontSizeChange = (fontSize: string) => {
        const newFontSize = Math.floor(parseFloat(fontSize));
        if (isNaN(newFontSize)) {
            setFontSize(12);
            return;
        }
        setFontSize(newFontSize);

        if (!graph || newFontSize < FONT_SIZE_LIMITS.min || newFontSize > FONT_SIZE_LIMITS.max) return;

        const cells = graph.getSelectionCells();
        // Measure before changing the model, then apply one undoable operation.
        const resizedCells = cells.map(cell => {
            const oldFontSize = graph.getCellStyle(cell).fontSize ?? 12;
            const geometry = cell.getGeometry();
            return {cell, geometry: isWhoCell(cell) && geometry
                ? scaleGeometryAroundCentre(geometry, newFontSize / oldFontSize)
                : newFontSize > oldFontSize ? getGeometryToFitLabel(graph, cell, newFontSize) : null};
        });
        graph.batchUpdate(() => {
            resizedCells.forEach(({cell, geometry}) => {
                if (geometry) graph.getDataModel().setGeometry(cell, geometry);
            });
            graph.setCellStyles("fontSize", newFontSize, cells);
        });

        const cellEditor = graph.getPlugin<CellEditorHandler>("CellEditorHandler");
        const editorElement = graph.container.querySelector<HTMLElement>(".mxCellEditor");
        if (cells.length > 0 && graph.isEditing() && editorElement) {
            editorElement.style.fontSize = `${newFontSize}px`;
            cellEditor.resize();
        }
    };

    return (
        <>
            <FormControl
                type="number"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                min={FONT_SIZE_LIMITS.min}
                max={FONT_SIZE_LIMITS.max}
                step={1}
                aria-describedby={fontSizeHintId}
            />
            <small id={fontSizeHintId} className="d-block text-muted mt-1">
                Font size: {FONT_SIZE_LIMITS.min}–{FONT_SIZE_LIMITS.max}
            </small>
        </>
    );
};

export default ScaleTextButton;
