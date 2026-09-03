/**
 * @jest-environment jsdom
 */
import {afterEach, describe, expect, it, vi} from "vitest";
import {prepareSvgForPng} from "./SvgExportUtils";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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

    Object.defineProperty(group, "getScreenCTM", {
        value: () => ({inverse: () => ({})}),
    });
    Object.defineProperty(svg, "createSVGPoint", {
        value: () => ({
            x: 0,
            y: 0,
            matrixTransform() {
                return {x: this.x, y: this.y};
            },
        }),
    });

    return svg;
};

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
});

describe("prepareSvgForPng", () => {
    it("converts HTML list labels to SVG text without changing the live SVG", () => {
        const svg = createTestSvg(["Independent", "Responsible"]);
        let activeTextNode: Node | null = null;
        let startOffset = 0;
        let endOffset = 0;

        vi.spyOn(document, "createRange").mockImplementation(() => ({
            setStart(node: Node, offset: number) {
                activeTextNode = node;
                startOffset = offset;
            },
            setEnd(_node: Node, offset: number) {
                endOffset = offset;
            },
            getBoundingClientRect() {
                const itemIndex = Array.from(svg.querySelectorAll("li"))
                    .findIndex(item => item.firstChild === activeTextNode);
                return {
                    left: 100 + startOffset * 8,
                    top: 20 + itemIndex * 20,
                    width: Math.max(endOffset - startOffset, 1) * 8,
                    height: 16,
                } as DOMRect;
            },
        } as Range));

        const exportSvg = prepareSvgForPng(svg);
        const exportedText = Array.from(exportSvg.querySelectorAll("text"))
            .map(element => element.textContent);

        expect(exportedText).toEqual(["•", "Independent", "•", "Responsible"]);
        expect(exportSvg.querySelector("foreignObject")).toBeNull();
        expect(exportSvg.firstElementChild?.tagName).toBe("rect");
        expect(svg.querySelector("foreignObject")).not.toBeNull();
        expect(svg.querySelector("rect")).toBeNull();
    });

    it("preserves the browser's wrapped line breaks", () => {
        const svg = createTestSvg(["Long label"]);
        let startOffset = 0;
        let endOffset = 0;

        vi.spyOn(document, "createRange").mockImplementation(() => ({
            setStart(_node: Node, offset: number) {
                startOffset = offset;
            },
            setEnd(_node: Node, offset: number) {
                endOffset = offset;
            },
            getBoundingClientRect() {
                const secondLine = startOffset >= 5;
                return {
                    left: 100 + (secondLine ? startOffset - 5 : startOffset) * 8,
                    top: secondLine ? 40 : 20,
                    width: Math.max(endOffset - startOffset, 1) * 8,
                    height: 16,
                } as DOMRect;
            },
        } as Range));

        const exportSvg = prepareSvgForPng(svg);
        const exportedText = Array.from(exportSvg.querySelectorAll("text"))
            .map(element => element.textContent);

        expect(exportedText).toEqual(["•", "Long", "label"]);
    });
});
