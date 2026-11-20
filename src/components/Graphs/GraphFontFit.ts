import type {Cell, CellEditorHandler, Geometry, Graph} from "@maxgraph/core";
import {getInternalLabelArea} from "./GraphLabelUtils";
import {cloneNodeWithMap} from "../utils/cloneNodeWithMap";

// Both endpoints must be established by the caller. Return the fitting side
// of the boundary, whether increasing a dimension or decreasing a font size.
export function findFittingBoundary(fits: (value: number) => boolean, nonFitting: number, fitting: number, precision: number): number {
    while (Math.abs(fitting - nonFitting) > precision) {
        const middle = (nonFitting + fitting) / 2;
        if (fits(middle)) fitting = middle;
        else nonFitting = middle;
    }
    return fitting;
}

// Find the smallest fitting scale to within half a graph unit. Re-measure
// each width because wider labels can wrap onto fewer lines.
export function findFittingScale(fits: (scale: number) => boolean, size: number): number {
    if (fits(1)) return 1;
    let high = 2;
    while (!fits(high)) high *= 2;
    return findFittingBoundary(fits, 1, high, 0.5 / size);
}

// Own the temporary DOM and its text-layout styles. The caller supplies label
// dimensions in graph units and disposes the measurement after the search.
function createLabelMeasurement(source: Element) {
    const document = source.ownerDocument;
    const probe = document.createElement("div");
    const copies = new Map<Node, Node>();
    const label = cloneNodeWithMap(source, copies) as HTMLElement;
    probe.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;";
    probe.setAttribute("aria-hidden", "true");

    const originals = [source, ...source.querySelectorAll("*")];
    const fontMetrics = originals.map(element => {
        const computed = document.defaultView!.getComputedStyle(element);
        const copy = copies.get(element) as HTMLElement;
        // Copy only text-layout styles. Copying all computed CSS would also
        // import editor positioning and fixed dimensions into the measurement.
        for (const property of [
            "font-family", "font-weight", "font-style", "letter-spacing",
            "word-spacing", "white-space", "overflow-wrap", "word-break",
            "text-indent", "box-sizing", "display", "margin", "padding",
            "list-style-type", "list-style-position",
        ]) {
            copy.style.setProperty(property, computed.getPropertyValue(property));
        }
        copy.style.height = "auto";
        copy.style.minHeight = "0";
        copy.style.maxHeight = "none";
        copy.style.width = "auto";
        copy.style.overflow = "visible";
        copy.style.transform = "none";
        copy.style.position = "static";
        const sourceFontSize = parseFloat(computed.fontSize);
        return {
            copy,
            lineHeight: computed.lineHeight === "normal" ? null : parseFloat(computed.lineHeight) / sourceFontSize,
            indent: element.tagName === "UL" ? parseFloat(computed.paddingLeft) / sourceFontSize : null,
            rightIndent: element.tagName === "UL" ? parseFloat(computed.paddingRight) / sourceFontSize : null,
        };
    });
    // Test capacity against the full safe area, not the visible shrink-to-fit
    // list width. Centring short lists does not reduce the space they may use.
    label.style.width = "100%";
    probe.appendChild(label);
    document.body.appendChild(probe);
    return {
        fits(width: number, height: number, fontSize: number) {
            if (width <= 0 || height <= 0) return false;
            fontMetrics.forEach(({copy, lineHeight, indent, rightIndent}) => {
                copy.style.fontSize = `${fontSize}px`;
                copy.style.lineHeight = lineHeight === null ? "normal" : `${lineHeight * fontSize}px`;
                // Preserve the existing em-based bullet indentation at the new size.
                if (indent !== null) copy.style.paddingLeft = `${indent * fontSize}px`;
                if (rightIndent !== null) copy.style.paddingRight = `${rightIndent * fontSize}px`;
            });
            probe.style.width = `${width}px`;
            // Both horizontal metrics use integer CSS pixels. Comparing
            // scrollWidth with a fractional width can falsely report overflow.
            return label.getBoundingClientRect().height <= height && label.scrollWidth <= label.clientWidth;
        },
        dispose() {
            probe.remove();
        },
    };
}

// Share one unclipped copy for font growth and manual shrinking. Bounds are
// graph units, not screen pixels; callers own cleanup with try/finally.
export function createCellLabelMeasurement(graph: Graph, cell: Cell) {
    const style = graph.getCellStyle(cell);
    const area = getInternalLabelArea(style.shape ?? "");
    const geometry = cell.getGeometry();
    if (!area || !geometry) return null;

    const text = graph.getView().getState(cell)?.text;
    const editor = graph.getPlugin<CellEditorHandler>("CellEditorHandler");
    const source = editor?.getEditingCell() === cell
        ? editor.textarea?.querySelector("ul") ?? editor.textarea
        : text?.node?.querySelector("ul, .goal-label-text");
    // Empty labels have nothing to fit. Non-rendered cells cannot be measured.
    if (!source || !text?.bounds) return null;

    // Text bounds are in view coordinates. Remove graph zoom before measuring.
    const width = text.bounds.width / text.scale;
    const height = text.bounds.height / text.scale;
    const measurement = createLabelMeasurement(source);
    return {
        fits(bounds: {width: number; height: number}, fontSize: number) {
            return measurement.fits(
                // Match maxGraph's rounded HTML label dimensions. Round the
                // requested area, not the starting area, to avoid resize drift.
                Math.round(width + (bounds.width - geometry.width) * area.width),
                Math.round(height + (bounds.height - geometry.height) * area.height),
                fontSize,
            );
        },
        dispose: measurement.dispose,
    };
}

// Measure without changing the graph model or its undo history.
export function getGeometryToFitLabel(graph: Graph, cell: Cell, fontSize: number) {
    const geometry = cell.getGeometry();
    if (!geometry) return null;
    const measurement = createCellLabelMeasurement(graph, cell);
    if (!measurement) return null;
    try {
        const factor = findFittingScale(scale => measurement.fits({
            width: geometry.width * scale, height: geometry.height * scale,
        }, fontSize), Math.max(geometry.width, geometry.height));
        if (factor === 1) return null;
        return scaleGeometryAroundCentre(geometry, factor);
    } finally {
        measurement.dispose();
    }
}

export function scaleGeometryAroundCentre(geometry: Geometry, factor: number) {
    const scaled = geometry.clone();
    scaled.width *= factor;
    scaled.height *= factor;
    scaled.x -= (scaled.width - geometry.width) / 2;
    scaled.y -= (scaled.height - geometry.height) / 2;
    return scaled;
}
