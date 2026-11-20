import type {Cell, Graph} from "@maxgraph/core";
import {hasCellId, isFunctionCell, isFunctionCellId, isNonFunctionCell} from "./GraphCellUtils";
import type {GoalLayout} from "../utils/modelJson";
import type {TreeGoal} from "../utils/types";

// Coordinates, text and colour can change without changing the hierarchy.
// Only membership, order, type and parent/child relationships affect layout.
export const hasSameGoalHierarchy = (previous: readonly TreeGoal[], current: readonly TreeGoal[]): boolean => (
    previous === current || (previous.length === current.length && previous.every((node, index) => {
        const next = current[index];
        return node.instanceId === next.instanceId && node.type === next.type
            && hasSameGoalHierarchy(node.children ?? [], next.children ?? []);
    }))
);

// Membership IDs are needed for editing/deletion, but change when a point is
// added. Keep a separate layout identity for each parent/type group. Weak keys
// follow the rendered cells' lifetime and do not depend on visible edges.
const nonFunctionalGroupKeys = new WeakMap<Cell, string>();

export const registerNonFunctionalGroup = (cell: Cell, source: Cell, type: string) => {
    nonFunctionalGroupKeys.set(cell, JSON.stringify([source.getId(), type]));
};

export const captureGoalLayouts = (graph: Graph) => {
    const functionalLayout: GoalLayout = {};
    const nonFunctionalLayout: GoalLayout = {};
    for (const [id, {x, y, width, height, fontSize}] of captureGoalGeometry(graph)) {
        const layout = isFunctionCellId(id) ? functionalLayout : nonFunctionalLayout;
        layout[id] = {x, y, width, height, ...(fontSize !== undefined ? {fontSize} : {})};
    }
    return {functionalLayout, nonFunctionalLayout};
};

// Apply only layout fields: snapshots also carry label text, which must not
// overwrite the current value or become part of the cell's geometry.
const applyCellLayout = (graph: Graph, cell: Cell, layout: GoalLayout[string]) => {
    const geometry = cell.getGeometry()?.clone();
    if (geometry) {
        const {x, y, width, height} = layout;
        Object.assign(geometry, {x, y, width, height});
        graph.getDataModel().setGeometry(cell, geometry);
        if (layout.fontSize !== undefined) graph.setCellStyles("fontSize", layout.fontSize, [cell]);
    }
};

// Reopening a model uses its saved membership IDs; leave new groups to automatic layout.
// Stored coordinates are graph units, independent of viewport zoom.
export const applyGoalLayout = (graph: Graph, layout: GoalLayout) => {
    graph.getChildVertices(graph.getDefaultParent()).forEach(cell => {
        const id = cell.getId();
        if (!hasCellId(id)) return;
        const saved = layout[id];
        if (saved) applyCellLayout(graph, cell, saved);
    });
};

export interface GoalGeometrySnapshot {
    groupKey?: string;
    value: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
}

// Preserve goal geometry and font while text or membership edits rebuild the graph.
export const captureGoalGeometry = (graph: Graph) => {
    const snapshots = new Map<string, GoalGeometrySnapshot>();

    graph.getChildVertices(graph.getDefaultParent()).forEach(cell => {
        const geometry = cell.getGeometry();

        if ((isNonFunctionCell(cell) || isFunctionCell(cell)) && geometry) {
            snapshots.set(cell.getId()!, {
                groupKey: nonFunctionalGroupKeys.get(cell),
                value: String(cell.getValue() ?? ""),
                x: geometry.x,
                y: geometry.y,
                width: geometry.width,
                height: geometry.height,
                fontSize: cell.getStyle().fontSize,
            });
        }
    });

    return snapshots;
};

export const restoreGoalGeometry = (
    graph: Graph,
    snapshots: Map<string, GoalGeometrySnapshot>,
    editedCellIds: ReadonlySet<string>,
    {hierarchyUnchanged = false, hasSavedLayout = false}: {
        hierarchyUnchanged?: boolean;
        hasSavedLayout?: boolean;
    } = {}
) => {
    const snapshotsByGroup = new Map(Array.from(snapshots, ([id, snapshot]) => [
        snapshot.groupKey ?? id, {id, snapshot},
    ]));
    const matchedCells = graph.getChildVertices(graph.getDefaultParent()).flatMap(cell => {
        const id = cell.getId();
        if (!hasCellId(id)) return [];
        const previous = snapshotsByGroup.get(nonFunctionalGroupKeys.get(cell) ?? id);
        return previous ? [{cell, id, previous}] : [];
    });
    const changedCells = matchedCells.filter(({cell, id, previous}) => (
        id !== previous.id || editedCellIds.has(id) || previous.snapshot.value !== String(cell.getValue() ?? "")
    )).map(({cell}) => cell);

    // Preserve positions for moves/text edits, imported layouts and changed
    // labels/group membership. Only other structural edits use new positions.
    const preservePositions = hierarchyUnchanged || hasSavedLayout || changedCells.length > 0;
    // Every matched goal keeps its size/font regardless of placement policy.
    matchedCells.forEach(({cell, previous}) => {
        if (preservePositions) {
            applyCellLayout(graph, cell, previous.snapshot);
        } else {
            const geometry = cell.getGeometry()!;
            applyCellLayout(graph, cell, {...previous.snapshot, x: geometry.x, y: geometry.y});
        }
    });
    // Measure these labels only after the restored geometry and font render.
    return changedCells;
};
