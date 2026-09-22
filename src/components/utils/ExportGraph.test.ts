/**
* @jest-environment jsdom
*/
import {describe, expect, it} from "vitest";
import {Graph} from "@maxgraph/core";
import {buildExportableSVG, EXPORT_PADDING} from "./ExportGraph.ts";

// Minimal stand-in for a rendered graph: buildExportableSVG only reads the
// graph bounds and the current zoom, so there is no need for a real canvas.
const stubGraph = (
    bounds: { x: number, y: number, width: number, height: number },
    scale = 1,
) => ({
    getGraphBounds: () => bounds,
    getView: () => ({getScale: () => scale}),
} as unknown as Graph);

// Mirrors what maxGraph builds: a container-sized SVG with no viewBox
const liveSVG = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';

    const node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    node.setAttribute('x', '-150');
    svg.appendChild(node);

    return svg;
};

describe('buildExportableSVG', () => {
    it('should set a viewBox covering the graph bounds plus padding', () => {
        const {clone, x, y, width, height} = buildExportableSVG(
            stubGraph({x: 100, y: -50, width: 200, height: 80}),
            liveSVG(),
        );

        expect({x, y, width, height}).toEqual({x: 80, y: -70, width: 240, height: 120});
        expect(clone.getAttribute('viewBox')).toBe('80 -70 240 120');
        expect(clone.getAttribute('width')).toBe('240');
        expect(clone.getAttribute('height')).toBe('120');
    });

    // The regression behind #327: nodes at negative coordinates were cropped
    // because the exported SVG defaulted to an origin of (0, 0)
    it('should include nodes positioned above and to the left of the origin', () => {
        const {clone} = buildExportableSVG(
            stubGraph({x: -400, y: -300, width: 500, height: 400}),
            liveSVG(),
        );

        expect(clone.getAttribute('viewBox')).toBe('-420 -320 540 440');
    });

    it('should scale the padding with the zoom level so the margin is constant in graph units', () => {
        const scale = 2;
        const {x, width} = buildExportableSVG(
            stubGraph({x: 0, y: 0, width: 100, height: 100}, scale),
            liveSVG(),
        );

        expect(x).toBe(-EXPORT_PADDING * scale);
        expect(width).toBe(100 + EXPORT_PADDING * scale * 2);
    });

    it('should drop the container-relative sizing but keep the graph contents', () => {
        const svg = liveSVG();
        const {clone} = buildExportableSVG(stubGraph({x: 0, y: 0, width: 10, height: 10}), svg);

        expect(clone.getAttribute('style')).toBeNull();
        expect(clone.querySelectorAll('rect')).toHaveLength(1);
    });

    it('should leave the on-screen SVG untouched', () => {
        const svg = liveSVG();
        buildExportableSVG(stubGraph({x: 0, y: 0, width: 10, height: 10}), svg);

        expect(svg.style.width).toBe('100%');
        expect(svg.getAttribute('viewBox')).toBeNull();
    });

    it('should serialize to standalone SVG with a single namespace declaration', () => {
        const {clone} = buildExportableSVG(stubGraph({x: 0, y: 0, width: 10, height: 10}), liveSVG());
        const svgString = new XMLSerializer().serializeToString(clone);

        expect(svgString.match(/xmlns=/g)).toHaveLength(1);
        expect(svgString).toContain('viewBox="-20 -20 50 50"');
    });
});
