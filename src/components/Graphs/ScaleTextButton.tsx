import {useState, useEffect} from "react";
import FormControl from "react-bootstrap/FormControl";
import {Cell, CellEditorHandler, Graph, InternalEvent} from "@maxgraph/core";
import {useGraph} from "../context/GraphContext";
import {VERTEX_FONT} from "../utils/GraphConstants.tsx";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 40;

const getCellsForFontSizeChange = (graph: Graph): Cell[] => {
    const selectedCells = graph.getSelectionCells();
    const cells = selectedCells.length > 0
        ? selectedCells
        : graph.getDefaultParent().getDescendants();
    return cells.filter(cell => cell.isVertex());
};

const getFontSize = (graph: Graph, cell: Cell): number => {
    const size = graph.getCellStyle(cell).fontSize ?? VERTEX_FONT.size;
    // Use whole font sizes in this control, including after node resizing.
    return Math.round(size);
};

const ScaleTextButton = () => {
    const {graph} = useGraph();
    const [fontSize, setFontSize] = useState(String(VERTEX_FONT.size));
    const [hasCells, setHasCells] = useState(false);

    useEffect(() => {
        if (!graph) return;

        const updateFontSize = () => {
            const cells = getCellsForFontSizeChange(graph);
            setHasCells(cells.length > 0);
            if (cells.length === 0) {
                setFontSize(String(VERTEX_FONT.size));
                return;
            }

            const firstFontSize = getFontSize(graph, cells[0]);
            const sameFontSize = cells.every(cell => getFontSize(graph, cell) === firstFontSize);
            setFontSize(sameFontSize ? String(firstFontSize) : "");
        };

        updateFontSize();

        // Model changes include resizing, undo/redo, and rebuilding the canvas.
        graph.getSelectionModel().addListener(InternalEvent.CHANGE, updateFontSize);
        graph.getDataModel().addListener(InternalEvent.CHANGE, updateFontSize);
        return () => {
            graph.getSelectionModel().removeListener(updateFontSize);
            graph.getDataModel().removeListener(updateFontSize);
        };
    }, [graph]);

    const applyFontSize = (value: number, relative = false) => {
        if (!graph) return;
        const cells = getCellsForFontSizeChange(graph);
        if (relative) {
            graph.getDataModel().batchUpdate(() => {
                cells.forEach(cell => {
                    const currentSize = getFontSize(graph, cell);
                    const newSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, currentSize + value));
                    if (newSize !== currentSize) graph.setCellStyles("fontSize", newSize, [cell]);
                });
            });
        } else {
            graph.setCellStyles("fontSize", value, cells);
        }

        const cellEditor = graph.getPlugin<CellEditorHandler>("CellEditorHandler");
        const editingCell = cellEditor?.getEditingCell();
        const editorElement = graph.container.querySelector<HTMLElement>(".mxCellEditor");
        if (editingCell && cells.includes(editingCell) && editorElement) {
            editorElement.style.fontSize = `${getFontSize(graph, editingCell)}px`;
            cellEditor.resize();
        }
    };

    const handleFontSizeChange = (value: string, nativeEvent: Event) => {
        const newFontSize = parseInt(value, 10);
        if (isNaN(newFontSize)) {
            setFontSize(String(VERTEX_FONT.size));
            return;
        }

        // Native steppers emit an Event; typing and pasting emit an InputEvent.
        if (nativeEvent.type === "input" && !("inputType" in nativeEvent)) {
            applyFontSize(Math.sign(newFontSize - Number(fontSize)), true);
            return;
        }

        setFontSize(String(newFontSize));
        if (newFontSize < MIN_FONT_SIZE || newFontSize > MAX_FONT_SIZE) return;
        applyFontSize(newFontSize);
    };

    return (
        <FormControl type="number" size="sm"
                     title="Applies to selected elements or the whole model when nothing is selected."
                     aria-label="Font size"
                     value={fontSize}
                     disabled={!hasCells}
                     onChange={(e) => handleFontSizeChange(e.target.value, e.nativeEvent)}
                     // With mixed sizes, native arrows emit +1/-1 from blank;
                     // applyFontSize enforces the limits separately for each node.
                     min={fontSize === "" ? undefined : MIN_FONT_SIZE}
                     max={fontSize === "" ? undefined : MAX_FONT_SIZE}/>
    );
};

export default ScaleTextButton;
