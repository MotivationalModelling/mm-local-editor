import {Cell, CellEditorHandler, CellState} from "@maxgraph/core";
import {convertEditingValueToList, isListLabelCell, readListEditorValue} from "./GraphLabelUtils";
import {makeHtmlListLabel} from "./GraphListLabel";

// Inherits CellEditorHandler.pluginId so graph editing uses this registered plugin.
export class GoalCellEditorHandler extends CellEditorHandler {
    override getInitialValue(state: CellState, trigger: MouseEvent | null): string {
        if (isListLabelCell(state.cell)) {
            return makeHtmlListLabel(convertEditingValueToList(this.graph.getEditingValue(state.cell, trigger)));
        }
        return super.getInitialValue(state, trigger);
    }

    override getCurrentValue(state: CellState): string | null {
        if (isListLabelCell(state.cell) && this.textarea) {
            return readListEditorValue(this.textarea) ?? super.getCurrentValue(state);
        }
        return super.getCurrentValue(state);
    }

    override startEditing(cell: Cell, trigger: MouseEvent | null = null): void {
        super.startEditing(cell, trigger);
        if (isListLabelCell(cell) && this.textarea) {
            // Keep the temporary editor inside the shape-specific label bounds.
            this.textarea.style.boxSizing = "border-box";
            this.textarea.style.overflow = "auto";
        }
    }
}
