import {Cell, Graph} from "@maxgraph/core";
import {isNonFunctionCell} from "./GraphCellUtils";
import {convertEditingValueToList, isListLabelCell, normaliseListLabelItems} from "./GraphLabelUtils";
import {makeHtmlListLabel} from "./GraphListLabel";

export class GoalGraph extends Graph {
    override getLabel = (cell: Cell): string | null => {
        const label = super.getLabel(cell);
        if (label && isListLabelCell(cell)) {
            return makeHtmlListLabel(convertEditingValueToList(label));
        } else if (label && isNonFunctionCell(cell)) {
            return normaliseListLabelItems(convertEditingValueToList(label)).join(",\n");
        }
        return label;
    };

    override isHtmlLabel = (cell: Cell): boolean => {
        return isListLabelCell(cell) || super.isHtmlLabel(cell);
    };
}
