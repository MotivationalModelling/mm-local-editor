import type {Graph} from "@maxgraph/core";
import {getListLabelArea} from "./GraphLabelUtils";

export interface NonFunctionalGeometrySnapshot {
    value: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// Preserve manual non-functional geometry while a text edit rebuilds the graph.
export const captureNonFunctionalGeometry = (graph: Graph) => {
    const snapshots = new Map<string, NonFunctionalGeometrySnapshot>();

    graph.getChildVertices(graph.getDefaultParent()).forEach(cell => {
        const id = cell.getId();
        const geometry = cell.getGeometry();

        if (id?.startsWith("Nonfunctional-") && geometry) {
            snapshots.set(id, {
                value: String(cell.getValue() ?? ""),
                x: geometry.x,
                y: geometry.y,
                width: geometry.width,
                height: geometry.height,
            });
        }
    });

    return snapshots;
};

export const restoreNonFunctionalGeometry = (
    graph: Graph,
    snapshots: Map<string, NonFunctionalGeometrySnapshot>,
    editedCellIds: ReadonlySet<string>,
    labelPadding: number
) => {
    const cells = graph.getChildVertices(graph.getDefaultParent());
    const hasTextChanges = cells.some(cell => {
        const id = cell.getId();
        const snapshot = id ? snapshots.get(id) : undefined;

        return snapshot && id && (
            editedCellIds.has(id) || snapshot.value !== String(cell.getValue() ?? "")
        );
    });

    // Keep existing layout behaviour for renders unrelated to label edits.
    if (!hasTextChanges) return;

    cells.forEach(cell => {
        const id = cell.getId();
        const snapshot = id ? snapshots.get(id) : undefined;

        if (!id || !snapshot) return;

        const textChanged = editedCellIds.has(id) || snapshot.value !== String(cell.getValue() ?? "");
        const geometry = cell.getGeometry()?.clone();
        const labelArea = getListLabelArea(cell.getStyle().shape ?? "");

        if (!geometry) return;

        geometry.x = snapshot.x;
        geometry.y = snapshot.y;
        geometry.width = snapshot.width;
        geometry.height = snapshot.height;

        // Grow only the edited shape, and only when its safe label area is too short.
        if (textChanged && labelArea) {
            const labelWidth = snapshot.width * labelArea.width;
            const preferred = graph.getPreferredSizeForCell(cell, labelWidth);

            if (preferred) {
                const labelHeight = preferred.height + labelPadding;
                geometry.height = Math.max(snapshot.height, labelHeight / labelArea.height);
            }
        }

        graph.getDataModel().setGeometry(cell, geometry);
    });
};
