import type {Cell} from "@maxgraph/core";

// Keep the graph's ID convention behind one predicate so consumers need not
// know how grouped non-functional cells (including stakeholders) are identified.
export const isNonFunctionCell = (cell: Pick<Cell, "getId">): boolean => (
    cell.getId()?.startsWith("Nonfunctional-") ?? false
);
