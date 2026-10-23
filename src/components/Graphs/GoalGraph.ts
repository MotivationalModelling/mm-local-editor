import {Cell, Graph, GraphPluginConstructor} from "@maxgraph/core";
import {getGoalRefType} from "../utils/GraphUtils";

// Keep connection rules explicit and read the latest pending edge after each graph rebuild.
export class GoalGraph extends Graph {
    constructor(container: HTMLElement, plugins: GraphPluginConstructor[], private readonly getPendingParentEdge: () => Cell | null) {
        super(container, undefined, plugins);
    }

    override isCellDisconnectable = (cell: Cell, terminal: Cell | null, source: boolean): boolean => {
        return cell !== this.getPendingParentEdge() && super.isCellDisconnectable(cell, terminal, source);
    };

    override getEdgeValidationError = (edge: Cell | null, source: Cell | null, target: Cell | null): string | null => {
        let validationError: string | null;
        if (edge && edge === this.getPendingParentEdge() && source && (getGoalRefType(source.getId()) !== "Functional" || source === target)) {
            validationError = "Connect the free end to another functional goal.";
        } else {
            validationError = super.getEdgeValidationError(edge, source, target);
        }
        return validationError;
    };
}
