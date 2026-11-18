import {Cell, Graph, InternalMouseEvent} from "@maxgraph/core";
import {isNonFunctionCell} from "./GraphCellUtils";
import {convertEditingValueToList, isListLabelCell, normaliseListLabelItems} from "./GraphLabelUtils";
import {makeHtmlListLabel} from "./GraphListLabel";
import {getGoalLinkForCell} from "./GraphHelpers";

export class GoalGraph extends Graph {
    override getCursorForMouseEvent = (mouseEvent: InternalMouseEvent): string | null => {
        const cell = mouseEvent.getCell();
        const labelNode = cell ? this.getView().getState(cell)?.text?.node : null;
        if (cell && getGoalLinkForCell(cell) && labelNode?.contains(mouseEvent.getSource())) {
            return "pointer";
        }
        return super.getCursorForMouseEvent(mouseEvent);
    };

    override getLabel = (cell: Cell): string | null => {
        const label = super.getLabel(cell);
        if (label) {
            if (isListLabelCell(cell)) {
                return makeHtmlListLabel(convertEditingValueToList(label));
            } else if (isNonFunctionCell(cell)) {
                return normaliseListLabelItems(convertEditingValueToList(label)).join(",\n");
            }
        }
        return label;
    };

    override isHtmlLabel = (cell: Cell): boolean => {
        return isListLabelCell(cell) || super.isHtmlLabel(cell);
    };
}
