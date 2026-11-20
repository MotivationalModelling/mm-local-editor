import {Cell, CellState, Graph, InternalMouseEvent, Rectangle, VertexHandler} from "@maxgraph/core";
import {isNonFunctionCell} from "./GraphCellUtils";
import {convertEditingValueToList, getInternalLabelArea, isDoCell, isListLabelCell, isWhoCell, normaliseListLabelItems} from "./GraphLabelUtils";
import {makeHtmlListLabel} from "./GraphListLabel";
import {getGoalLinkForCell} from "./GraphHelpers";
import {makeHtmlDoLabel} from "./GraphDoLabel";
import {getGoalLabelResizePlan} from "./GraphLabelResize";
import {GoalVertexHandler} from "./GoalVertexHandler";

export class GoalGraph extends Graph {
    override createVertexHandler(state: CellState): VertexHandler {
        return getInternalLabelArea(state.cell.getStyle().shape ?? "") || isWhoCell(state.cell)
            ? new GoalVertexHandler(state)
            : super.createVertexHandler(state);
    }

    override resizeCells = (cells: Cell[], bounds: Rectangle[], recurse: boolean): Cell[] => {
        const plans = cells.map((cell, index) => getGoalLabelResizePlan(this, cell, bounds[index]));
        let resized: Cell[] = [];
        // Font and bounds form one undoable operation. Automatic growth uses
        // setGeometry, so only a user resize applies the reduction rule.
        this.batchUpdate(() => {
            plans.forEach((plan, index) => {
                if (plan) this.setCellStyles("fontSize", plan.fontSize, [cells[index]]);
            });
            resized = super.resizeCells(cells, bounds.map((bound, index) => plans[index]?.bounds ?? bound), recurse);
        });
        return resized;
    };

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
            } else if (isDoCell(cell)) {
                return makeHtmlDoLabel(label);
            } else if (isNonFunctionCell(cell)) {
                return normaliseListLabelItems(convertEditingValueToList(label)).join(",\n");
            }
        }
        return label;
    };

    override isHtmlLabel = (cell: Cell): boolean => {
        return isListLabelCell(cell) || isDoCell(cell) || super.isHtmlLabel(cell);
    };
}
