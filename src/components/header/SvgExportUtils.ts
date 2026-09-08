import type {Graph} from "@maxgraph/core";
import {convertEditingValueToList, isListLabelCell, normalizeListLabelItems} from "../Graphs/GraphLabelUtils";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
// Browser glyph rectangles on the same baseline can differ by a fraction of a pixel.
const LINE_POSITION_TOLERANCE = 1;
const BULLET_OFFSET_RATIO = 0.8;

export type ListLabelExportSource = {
    foreignObject: SVGForeignObjectElement;
    items: string[];
};

type TextLine = {text: string; x: number; y: number; height: number};
type LineOffsets = {start: number; end: number; top: number};
type TextSegment = {node: Text; start: number; end: number};

// The model supplies the text. Each cell's render state identifies its own DOM
// label, which is used only to measure browser wrapping, fonts and coordinates.
export const getListLabelExportSources = (graph: Graph): ListLabelExportSource[] => (
    graph.getChildVertices(graph.getDefaultParent()).flatMap(cell => {
        if (!isListLabelCell(cell)) return [];
        const foreignObject = graph.getView().getState(cell)?.text?.node
            ?.querySelector<SVGForeignObjectElement>("foreignObject");
        if (!foreignObject) return [];
        const items = normalizeListLabelItems(convertEditingValueToList(graph.convertValueToString(cell)));
        return [{foreignObject, items}];
    })
);

// Keep offsets over all text nodes, including text inside inline elements.
const collectTextSegments = (element: Element): TextSegment[] => {
    const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const segments: TextSegment[] = [];
    let offset = 0;
    let node = walker.nextNode();
    while (node) {
        const end = offset + (node.textContent?.length ?? 0);
        segments.push({node: node as Text, start: offset, end});
        offset = end;
        node = walker.nextNode();
    }
    return segments;
};

// Recover the browser's visual line breaks. Measuring whole words would miss
// overflow-wrap:anywhere breaks; code-point iteration avoids splitting emoji.
const findRenderedLineOffsets = (segments: TextSegment[], range: Range): LineOffsets[] => {
    const lines: LineOffsets[] = [];
    for (const segment of segments) {
        let offset = 0;
        for (const character of segment.node.data) {
            const end = offset + character.length;
            range.setStart(segment.node, offset);
            range.setEnd(segment.node, end);
            const rect = range.getBoundingClientRect();
            const previous = lines[lines.length - 1];
            if (!previous || Math.abs(rect.top - previous.top) > LINE_POSITION_TOLERANCE) {
                lines.push({start: segment.start + offset, end: segment.start + end, top: rect.top});
            } else {
                previous.end = segment.start + end;
            }
            offset = end;
        }
    }
    return lines;
};

// Convert a line's offsets into its model text and screen-space rectangle.
const measureTextLine = (text: string, segments: TextSegment[], range: Range, line: LineOffsets): TextLine[] => {
    let {start, end} = line;
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (start === end) return [];

    const first = segments.find(segment => segment.start <= start && segment.end > start)!;
    const last = segments.find(segment => segment.start < end && segment.end >= end)!;
    range.setStart(first.node, start - first.start);
    range.setEnd(last.node, end - last.start);
    const rect = range.getBoundingClientRect();
    return [{text: text.slice(start, end), x: rect.left, y: rect.top, height: rect.height}];
};

const measureRenderedTextLines = (element: Element, modelText: string): TextLine[] => {
    const segments = collectTextSegments(element);
    // Do not silently export stale model text at positions measured for other text.
    if (segments.map(segment => segment.node.data).join("") !== modelText) {
        throw new Error("The displayed label does not match the model. Finish editing and try exporting again.");
    }
    const range = element.ownerDocument.createRange();
    return findRenderedLineOffsets(segments, range)
        .flatMap(line => measureTextLine(modelText, segments, range, line));
};

const createSvgText = (document: Document, text: string, x: number, y: number, style: CSSStyleDeclaration) => {
    const element = document.createElementNS(SVG_NAMESPACE, "text");
    element.setAttribute("x", String(x));
    element.setAttribute("y", String(y));
    element.setAttribute("fill", style.color);
    element.setAttribute("font-family", style.fontFamily);
    element.setAttribute("font-size", style.fontSize);
    element.setAttribute("font-style", style.fontStyle);
    element.setAttribute("font-weight", style.fontWeight);
    element.setAttribute("dominant-baseline", "text-before-edge");
    element.setAttribute("pointer-events", "none");
    element.textContent = text;
    return element;
};

// Pair original nodes with their copies while cloning. Export never relies on
// independently queried DOM lists having matching indices or mutates the canvas.
const cloneSvgWithNodeMap = (svg: SVGSVGElement) => {
    const copies = new Map<Node, Node>();
    const cloneNode = (original: Node): Node => {
        const copy = original.cloneNode(false);
        copies.set(original, copy);
        original.childNodes.forEach(child => copy.appendChild(cloneNode(child)));
        return copy;
    };
    return {svg: cloneNode(svg) as SVGSVGElement, copies};
};

const convertListLabelToSvg = (svg: SVGSVGElement, source: ListLabelExportSource): SVGGElement => {
    const {foreignObject, items} = source;
    const elements = Array.from(foreignObject.querySelectorAll("li"));
    if (elements.length !== items.length) {
        throw new Error("The displayed list does not match the model. Finish editing and try exporting again.");
    }
    const parent = foreignObject.parentElement as SVGGraphicsElement | null;
    const matrix = parent?.getScreenCTM()?.inverse();
    if (!matrix) throw new Error("Cannot measure the label position for PNG export.");
    const group = svg.ownerDocument.createElementNS(SVG_NAMESPACE, "g");
    const appendText = (text: string, x: number, y: number, style: CSSStyleDeclaration) => {
        // Range gives screen coordinates; the SVG text must use its parent's
        // coordinates, undoing graph zoom and translation with the inverse CTM.
        const point = svg.createSVGPoint();
        point.x = x;
        point.y = y;
        const local = point.matrixTransform(matrix);
        group.appendChild(createSvgText(svg.ownerDocument, text, local.x, local.y, style));
    };

    items.forEach((text, index) => {
        const element = elements[index];
        const style = svg.ownerDocument.defaultView!.getComputedStyle(element);
        measureRenderedTextLines(element, text).forEach((line, lineIndex) => {
            if (lineIndex === 0) {
                appendText("•", line.x - line.height * BULLET_OFFSET_RATIO, line.y, style);
            }
            appendText(line.text, line.x, line.y, style);
        });
    });
    return group;
};

// Canvg cannot render our HTML list labels. Replace those labels with native
// SVG text on an export-only copy, preserving the browser's line breaks.
export const prepareSvgForPng = (svgElement: SVGSVGElement, sources: ListLabelExportSource[]) => {
    const {svg: exportSvg, copies} = cloneSvgWithNodeMap(svgElement);
    sources.forEach(source => {
        const copy = copies.get(source.foreignObject);
        if (!copy?.parentNode) throw new Error("The label is outside the exported SVG.");
        copy.parentNode.replaceChild(convertListLabelToSvg(svgElement, source), copy);
    });

    const background = exportSvg.ownerDocument.createElementNS(SVG_NAMESPACE, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "white");
    exportSvg.insertBefore(background, exportSvg.firstChild);
    return exportSvg;
};
