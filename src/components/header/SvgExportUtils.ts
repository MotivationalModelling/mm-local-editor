import type {Graph} from "@maxgraph/core";
import {buildExportableSVG} from "../utils/ExportGraph";
import {convertEditingValueToList, isListLabelCell, normaliseListLabelItems} from "../Graphs/GraphLabelUtils";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
// Browser glyph rectangles on the same baseline can differ by a fraction of a pixel.
const LINE_POSITION_TOLERANCE = 1;
const BULLET_OFFSET_RATIO = 0.8;
const LIST_BULLET = "•";

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
        const items = normaliseListLabelItems(convertEditingValueToList(graph.convertValueToString(cell)));
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
export const cloneNodeWithMap = (original: Node, copies: Map<Node, Node>): Node => {
    const copy = original.cloneNode(false);
    copies.set(original, copy);
    original.childNodes.forEach(child => copy.appendChild(cloneNodeWithMap(child, copies)));
    return copy;
};

const cloneSvgWithNodeMap = (svg: SVGSVGElement) => {
    const copies = new Map<Node, Node>();
    return {svg: cloneNodeWithMap(svg, copies) as SVGSVGElement, copies};
};

// DOM nodes supply measurements only; text and item count come from the model.
const getListItemMeasurements = ({foreignObject, items}: ListLabelExportSource) => {
    const list = foreignObject.querySelector("ul");
    if (list?.children.length !== items.length) {
        throw new Error("The displayed list does not match the model. Finish editing and try exporting again.");
    }
    return items.map((text, index) => {
        const element = list.children[index];
        return {
            lines: measureRenderedTextLines(element, text),
            style: element.ownerDocument.defaultView!.getComputedStyle(element),
        };
    });
};

export const createSvgTextAtScreenPosition = (
    svg: SVGSVGElement, matrix: DOMMatrix, text: string, x: number, y: number, style: CSSStyleDeclaration,
) => {
    // Undo graph zoom and translation for browser-measured screen coordinates.
    const point = svg.createSVGPoint();
    point.x = x;
    point.y = y;
    const local = point.matrixTransform(matrix);
    return createSvgText(svg.ownerDocument, text, local.x, local.y, style);
};

const convertListLabelToSvg = (svg: SVGSVGElement, source: ListLabelExportSource): SVGGElement => {
    const {foreignObject} = source;
    const parent = foreignObject.parentElement as SVGGraphicsElement | null;
    const matrix = parent?.getScreenCTM()?.inverse();
    if (!matrix) throw new Error("Cannot measure the label position for PNG export.");
    const group = svg.ownerDocument.createElementNS(SVG_NAMESPACE, "g");
    getListItemMeasurements(source).forEach(({lines, style}) => {
        lines.forEach((line, lineIndex) => {
            if (lineIndex === 0) {
                group.appendChild(createSvgTextAtScreenPosition(svg, matrix, LIST_BULLET,
                    line.x - line.height * BULLET_OFFSET_RATIO, line.y, style));
            }
            group.appendChild(createSvgTextAtScreenPosition(svg, matrix, line.text, line.x, line.y, style));
        });
    });
    return group;
};

// An exported SVG has no access to the application's Bootstrap/theme styles.
// Freeze the current appearance on the copy, never on the live graph.
export const prepareGraphForSvg = (graph: Graph, svgElement: SVGSVGElement) => {
    const {svg, copies} = cloneSvgWithNodeMap(svgElement);
    svgElement.querySelectorAll<HTMLElement>(".graph-list-label, .graph-list-label-items, .graph-list-label-items > li").forEach(element => {
        const copy = copies.get(element) as HTMLElement;
        const style = element.ownerDocument.defaultView!.getComputedStyle(element);
        for (const property of ["display", "align-items", "box-sizing", "height", "width", "margin",
            "padding-left", "text-align", "white-space", "overflow-wrap", "list-style-type",
            "color", "font-family", "font-size", "font-weight", "font-style", "line-height"]) {
            copy.style.setProperty(property, style.getPropertyValue(property));
        }
    });
    return buildExportableSVG(graph, svg);
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

// Measure labels while they are attached to the live graph, then apply the
// full-model bounds to the converted copy. Detached labels have no DOM layout.
export const prepareGraphForPng = (graph: Graph, svgElement: SVGSVGElement) => {
    const converted = prepareSvgForPng(svgElement, getListLabelExportSources(graph));
    const prepared = buildExportableSVG(graph, converted);
    // prepareSvgForPng owns this background. Explicit bounds cover negative
    // coordinates too; a percentage-sized rectangle would still start at zero.
    const background = prepared.clone.firstElementChild!;
    for (const key of ["x", "y", "width", "height"] as const) {
        background.setAttribute(key, String(prepared[key]));
    }
    return prepared;
};
