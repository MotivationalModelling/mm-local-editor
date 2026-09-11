import {useState, useEffect, useCallback} from "react";
import Button from "react-bootstrap/Button";
import FormControl from "react-bootstrap/FormControl";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {Cell, CellEditorHandler, Graph, InternalEvent} from "@maxgraph/core";
import {useGraph} from "../context/GraphContext";
import {VERTEX_FONT} from "../utils/GraphConstants.tsx";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 40;

const getFontSizeCells = (graph: Graph): Cell[] => {
    const selectedCells = graph.getSelectionCells();
    const cells = selectedCells.length > 0
        ? selectedCells
        : graph.getDefaultParent().getDescendants();
    return cells.filter(cell => cell.isVertex());
};

const getFontSize = (graph: Graph, cell: Cell): number => {
    const size = graph.getCellStyle(cell).fontSize ?? VERTEX_FONT.size;
    // Resizing can produce floating-point noise such as 12.000000000000002.
    return Number(size.toFixed(10));
};

type FontSizeDraft = {
    value: string;
    cells: Cell[];
};

const ScaleTextButton = () => {
    const {graph} = useGraph();
    const [fontSize, setFontSize] = useState(String(VERTEX_FONT.size));
    const [hasCells, setHasCells] = useState(false);
    const [draft, setDraft] = useState<FontSizeDraft | null>(null);

    const updateFontSize = useCallback(() => {
        setDraft(null);
        const cells = graph ? getFontSizeCells(graph) : [];
        setHasCells(cells.length > 0);
        if (!graph || cells.length === 0) {
            setFontSize(String(VERTEX_FONT.size));
            return;
        }

        const firstFontSize = getFontSize(graph, cells[0]);
        const sameFontSize = cells.every(cell => getFontSize(graph, cell) === firstFontSize);
        setFontSize(sameFontSize ? String(firstFontSize) : "");
    }, [graph]);

    useEffect(() => {
        updateFontSize();
        if (!graph) return;

        // Model changes include resizing, undo/redo, and rebuilding the canvas.
        graph.getSelectionModel().addListener(InternalEvent.CHANGE, updateFontSize);
        graph.getDataModel().addListener(InternalEvent.CHANGE, updateFontSize);
        return () => {
            graph.getSelectionModel().removeListener(updateFontSize);
            graph.getDataModel().removeListener(updateFontSize);
        };
    }, [graph, updateFontSize]);

    const applyFontSize = (transform: (currentSize: number) => number, targetCells?: Cell[]) => {
        if (!graph) return;
        const cells = targetCells ?? getFontSizeCells(graph);

        // A global or mixed-size adjustment should be a single undoable edit.
        graph.getDataModel().batchUpdate(() => {
            cells.forEach(cell => {
                const currentSize = getFontSize(graph, cell);
                const newSize = transform(currentSize);
                if (newSize !== currentSize) {
                    graph.setCellStyles("fontSize", newSize, [cell]);
                }
            });
        });

        const cellEditor = graph.getPlugin<CellEditorHandler>("CellEditorHandler");
        const editingCell = cellEditor?.getEditingCell();
        const editorElement = graph.container.querySelector<HTMLElement>(".mxCellEditor");
        if (editingCell && cells.includes(editingCell) && editorElement) {
            editorElement.style.fontSize = `${getFontSize(graph, editingCell)}px`;
            cellEditor.resize();
        }
        updateFontSize();
    };

    const commitFontSize = () => {
        if (!draft) return;
        const newSize = Number(draft.value);
        if (draft.value.trim() === "" || !Number.isFinite(newSize)
            || newSize < MIN_FONT_SIZE || newSize > MAX_FONT_SIZE) {
            updateFontSize();
            return;
        }
        // A canvas click can change the selection before the input loses focus.
        applyFontSize(() => newSize, draft.cells);
    };

    const stepFontSize = (step: number) => {
        applyFontSize(currentSize => Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, currentSize + step)));
    };

    return (
        <div className="d-flex flex-wrap gap-1"
             title="Applies to selected elements, or the whole model when nothing is selected.">
            <FormControl type="number" size="sm" style={{flex: "1 1 3rem", minWidth: "3rem"}}
                         aria-label="Font size"
                         value={draft?.value ?? fontSize}
                         disabled={!hasCells}
                         onChange={(e) => {
                             if (graph) setDraft({value: e.target.value, cells: getFontSizeCells(graph)});
                         }}
                         onBlur={commitFontSize}
                         onKeyDown={(e) => {
                             e.stopPropagation();
                             if (e.key === "Enter") {
                                 e.preventDefault();
                                 commitFontSize();
                             }
                         }}
                         min={MIN_FONT_SIZE}
                         max={MAX_FONT_SIZE}/>
            <ButtonGroup size="sm" className="flex-fill">
                <Button variant="light" aria-label="Decrease font size"
                        disabled={!hasCells} onClick={() => stepFontSize(-1)}>
                    −
                </Button>
                <Button variant="light" aria-label="Increase font size"
                        disabled={!hasCells} onClick={() => stepFontSize(1)}>
                    +
                </Button>
            </ButtonGroup>
        </div>
    );
};

export default ScaleTextButton;
