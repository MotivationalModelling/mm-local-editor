import type {Cell} from "@maxgraph/core";

// A cell ID is a string, not a numeric goal ID. Preserve "0" while excluding
// missing and empty IDs from snapshot lookups and edit/delete tracking.
export const hasCellId = (id: string | null): id is string => (
    id !== null && id !== ""
);

// Keep the graph's ID convention behind one predicate so consumers need not
// know how grouped non-functional cells (including stakeholders) are identified.
export const isNonFunctionCell = (cell: Pick<Cell, "getId">): boolean => (
    cell.getId()?.startsWith("Nonfunctional-") ?? false
);
