import type {Cell, Graph, Rectangle} from "@maxgraph/core";
import {createCellLabelMeasurement, findFittingBoundary} from "./GraphFontFit";
import {FONT_SIZE_LIMITS, getInternalLabelArea, isWhoCell} from "./GraphLabelUtils";

// Experimental breathing room for a label that cannot grow another point.
const CAPACITY_FONT_REDUCTION = 4;

type LabelFits = (bounds: Rectangle, fontSize: number) => boolean;

// Each drag is measured against its original bounds, never the last pointer
// movement. Returning null leaves enlargements and moves to maxGraph unchanged.
export function fitLabelToResize(original: Rectangle, requested: Rectangle, fontSize: number, fits: LabelFits) {
    const ratio = Math.min(requested.width / original.width, requested.height / original.height);
    if (ratio >= 1) return null;

    const baseline = fits(original, fontSize + 1) ? fontSize : fontSize - CAPACITY_FONT_REDUCTION;
    const candidate = Math.max(FONT_SIZE_LIMITS.min, Math.floor(baseline * ratio));
    if (fits(requested, candidate)) return {bounds: requested, fontSize: candidate};

    if (fits(requested, FONT_SIZE_LIMITS.min)) {
        return {
            bounds: requested,
            // Measure integer candidates so an exactly fitting size is not lost to rounding.
            fontSize: Math.floor(findFittingBoundary(size => fits(requested, Math.floor(size)), candidate, FONT_SIZE_LIMITS.min, 1)),
        };
    }

    // At minimum font size, stop along the requested drag path. Interpolating
    // position as well as size keeps the opposite handle anchored.
    const boundsAt = (progress: number) => {
        const bounds = original.clone();
        bounds.x += (requested.x - original.x) * progress;
        bounds.y += (requested.y - original.y) * progress;
        bounds.width += (requested.width - original.width) * progress;
        bounds.height += (requested.height - original.height) * progress;
        return bounds;
    };
    // An already clipped imported shape must not be made smaller still.
    if (!fits(original, FONT_SIZE_LIMITS.min)) return {bounds: original, fontSize: FONT_SIZE_LIMITS.min};
    const distance = Math.max(Math.abs(requested.width - original.width), Math.abs(requested.height - original.height));
    const progress = findFittingBoundary(value => fits(boundsAt(value), FONT_SIZE_LIMITS.min), 1, 0, 0.5 / distance);
    return {bounds: boundsAt(progress), fontSize: FONT_SIZE_LIMITS.min};
}

// The graph subclass owns the resize transaction; this function only measures
// and plans the font/bounds for a single goal without changing model state.
export function getGoalLabelResizePlan(graph: Graph, cell: Cell, requested: Rectangle) {
    const original = cell.getGeometry();
    if (!original) return null;
    const fontSize = graph.getCellStyle(cell).fontSize ?? 12;
    if (isWhoCell(cell)) {
        const ratio = Math.min(requested.width / original.width, requested.height / original.height);
        if (ratio === 1) return null;
        return {bounds: requested, fontSize: Math.max(FONT_SIZE_LIMITS.min,
            Math.min(FONT_SIZE_LIMITS.max, Math.floor(fontSize * ratio)))};
    }
    if (!getInternalLabelArea(cell.getStyle().shape ?? "")
        || (requested.width >= original.width && requested.height >= original.height)) return null;
    const measurement = createCellLabelMeasurement(graph, cell);
    if (!measurement) return null;
    try {
        return fitLabelToResize(original, requested, fontSize, measurement.fits);
    } finally {
        measurement.dispose();
    }
}
