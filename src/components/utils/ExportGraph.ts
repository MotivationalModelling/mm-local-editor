import {Graph} from '@maxgraph/core';

// Margin left around the model in an exported image, in graph (unscaled) units
// so the border looks the same no matter what zoom level the user exported at
export const EXPORT_PADDING = 20;

export interface ExportableSVG {
    clone: SVGSVGElement;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Produces a standalone copy of the graph's SVG, sized to fit every node.
 *
 * The live SVG relies on its scrollable parent container to decide which region
 * is visible, so maxGraph gives it no viewBox. Exported on its own that defaults
 * to an origin of (0, 0), clipping any node at a negative coordinate. Setting a
 * viewBox from the graph's real bounds makes the copy self-contained.
 *
 * Returns the clone plus its bounds, which callers rasterising to a canvas need
 * (the clone is detached, so its clientWidth/clientHeight are 0).
 */
export function buildExportableSVG(graph: Graph, svgElement: SVGSVGElement): ExportableSVG {
    // Smallest rectangle enclosing every node, in rendered view coordinates
    // (i.e. already multiplied by the current zoom), so scale the padding to match
    const bounds = graph.getGraphBounds();
    const padding = EXPORT_PADDING * graph.getView().getScale();

    const x = bounds.x - padding;
    const y = bounds.y - padding;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    // Work on a copy so the on-screen canvas is left untouched
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Drop the container-relative sizing (width/height 100%) maxGraph gave it
    clone.removeAttribute('style');

    // No xmlns is set here on purpose: the element is already in the SVG namespace,
    // so XMLSerializer emits the declaration itself. Setting it explicitly makes
    // some serializers (jsdom's, for one) write a duplicate and produce invalid XML.
    clone.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    return {clone, x, y, width, height};
}
