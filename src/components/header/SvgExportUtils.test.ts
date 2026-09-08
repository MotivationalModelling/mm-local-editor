/**
 * @jest-environment jsdom
 */
import {afterEach, describe, expect, it, vi} from "vitest";
import {prepareGraphForPng, prepareSvgForPng} from "./SvgExportUtils";
import type {Graph} from "@maxgraph/core";
import type {ListLabelExportSource} from "./SvgExportUtils";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// jsdom does not perform SVG layout. Supply a known screen-to-SVG transform
// so these unit tests can assert coordinates; Cypress tests real browser layout.
const mockSvgScreenTransform = (svg: SVGSVGElement, group: SVGGElement, scale = 1, translateX = 0, translateY = 0) => {
    Object.defineProperty(group, "getScreenCTM", {
        value: () => ({inverse: () => ({scale, translateX, translateY})}),
        configurable: true,
    });
    Object.defineProperty(svg, "createSVGPoint", {
        value: () => ({
            x: 0,
            y: 0,
            matrixTransform(matrix: {scale: number; translateX: number; translateY: number}) {
                return {x: (this.x - matrix.translateX) / matrix.scale, y: (this.y - matrix.translateY) / matrix.scale};
            },
        }),
        configurable: true,
    });
};

// Range geometry is also unavailable in jsdom. Each test supplies explicit
// glyph positions, independently of the exporter's line-detection algorithm.
const mockRangeGeometry = (getRect: (node: Node, start: number, end: number) => Partial<DOMRect>) => {
    let node: Node;
    let start = 0;
    let end = 0;
    vi.spyOn(document, "createRange").mockImplementation(() => ({
        setStart(nextNode: Node, offset: number) { node = nextNode; start = offset; },
        setEnd(_node: Node, offset: number) { end = offset; },
        getBoundingClientRect: () => getRect(node, start, end),
    } as Range));
};

const createTestSvg = (items: string[]) => {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    const group = document.createElementNS(SVG_NAMESPACE, "g");
    const foreignObject = document.createElementNS(SVG_NAMESPACE, "foreignObject");
    const list = document.createElement("ul");

    items.forEach(item => {
        const listItem = document.createElement("li");
        listItem.style.color = "rgb(0, 0, 0)";
        listItem.style.fontFamily = "Arial";
        listItem.style.fontSize = "16px";
        listItem.textContent = item;
        list.appendChild(listItem);
    });

    foreignObject.appendChild(list);
    group.appendChild(foreignObject);
    svg.appendChild(group);
    document.body.appendChild(svg);

    mockSvgScreenTransform(svg, group);
    // Keep model text separate from DOM text, as the production graph does.
    const source: ListLabelExportSource = {foreignObject, items: [...items]};
    return {svg, group, source};
};

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
});

describe("prepareSvgForPng", () => {
    it("covers negative model coordinates with an opaque background without changing the live SVG", () => {
        const {svg} = createTestSvg([]);
        const graph = {
            getGraphBounds: () => ({x: -100, y: -50, width: 400, height: 300}),
            getView: () => ({getScale: () => 2}),
            getDefaultParent: () => null,
            getChildVertices: () => [],
        } as unknown as Graph;
        const {clone, width, height} = prepareGraphForPng(graph, svg);
        expect(clone.getAttribute("viewBox")).toBe("-140 -90 480 380");
        expect([width, height]).toEqual([480, 380]);
        const background = clone.firstElementChild!;
        expect(["x", "y", "width", "height", "fill"].map(key => background.getAttribute(key)))
            .toEqual(["-140", "-90", "480", "380", "white"]);
        expect(svg.hasAttribute("viewBox")).toBe(false);
        expect(svg.querySelector("rect")).toBeNull();
    });
    it("converts HTML list labels to SVG text without changing the live SVG", () => {
        const {svg, source} = createTestSvg(["Independent", "Responsible"]);
        mockRangeGeometry((activeTextNode, startOffset, endOffset) => {
            const itemIndex = Array.from(svg.querySelectorAll("li"))
                .findIndex(item => item.firstChild === activeTextNode);
            return {
                left: 100 + startOffset * 8,
                top: 20 + itemIndex * 20,
                width: Math.max(endOffset - startOffset, 1) * 8,
                height: 16,
            };
        });

        const exportSvg = prepareSvgForPng(svg, [source]);
        const exportedText = Array.from(exportSvg.querySelectorAll("text"))
            .map(element => element.textContent);

        expect(exportedText).toEqual(["•", "Independent", "•", "Responsible"]);
        expect(exportSvg.querySelector("foreignObject")).toBeNull();
        expect(exportSvg.firstElementChild?.tagName).toBe("rect");
        expect(svg.querySelector("foreignObject")).not.toBeNull();
        expect(svg.querySelector("rect")).toBeNull();
    });

    it("preserves the browser's wrapped line breaks", () => {
        const {svg, source} = createTestSvg(["Long label"]);
        mockRangeGeometry((_node, startOffset, endOffset) => {
            const secondLine = startOffset >= 5;
            return {
                left: 100 + (secondLine ? startOffset - 5 : startOffset) * 8,
                top: secondLine ? 40 : 20,
                width: Math.max(endOffset - startOffset, 1) * 8,
                height: 16,
            };
        });

        const exportSvg = prepareSvgForPng(svg, [source]);
        const exportedText = Array.from(exportSvg.querySelectorAll("text"))
            .map(element => element.textContent);

        expect(exportedText).toEqual(["•", "Long", "label"]);
    });

    it("converts screen coordinates back through zoom and translation", () => {
        const {svg, group, source} = createTestSvg(["A"]);
        mockSvgScreenTransform(svg, group, 2, 60, 20);
        mockRangeGeometry(() => ({left: 100, top: 40, width: 16, height: 32}));
        const output = prepareSvgForPng(svg, [source]);
        const text = output.querySelectorAll("text")[1];
        expect(text.getAttribute("x")).toBe("20");
        expect(text.getAttribute("y")).toBe("10");
    });

    it("does not substitute unrelated foreignObjects or trust stale DOM text", () => {
        const {svg, source} = createTestSvg(["Model text"]);
        const unrelated = document.createElementNS(SVG_NAMESPACE, "foreignObject");
        unrelated.setAttribute("id", "unrelated");
        svg.insertBefore(unrelated, svg.firstChild);
        mockRangeGeometry(() => ({left: 100, top: 20, width: 80, height: 16}));
        const output = prepareSvgForPng(svg, [source]);
        expect(output.querySelector("#unrelated")).not.toBeNull();
        expect(output.querySelectorAll("foreignObject")).toHaveLength(1);
        source.foreignObject.querySelector("li")!.textContent = "Stale text";
        expect(() => prepareSvgForPng(svg, [source])).toThrow("does not match the model");
    });

    it("preserves text across inline elements and keeps Unicode intact", () => {
        const {svg, source} = createTestSvg(["A & 中文 😀"]);
        source.foreignObject.querySelector("li")!.innerHTML = "<span>A &amp; </span><span>中文 😀</span>";
        mockRangeGeometry(() => ({left: 100, top: 20, width: 80, height: 16}));
        const output = prepareSvgForPng(svg, [source]);
        expect(Array.from(output.querySelectorAll("text"), text => text.textContent))
            .toEqual(["•", "A & 中文 😀"]);
    });
});
