const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const LINE_POSITION_TOLERANCE = 1;
const BULLET_OFFSET_RATIO = 0.8;

type TextLine = {
    text: string;
    x: number;
    y: number;
    height: number;
};

const getTextLines = (listItem: HTMLLIElement): TextLine[] => {
    const textNode = Array.from(listItem.childNodes)
        .find(node => node.nodeType === Node.TEXT_NODE);
    const text = textNode?.textContent ?? "";

    if (!textNode || text.trim().length === 0) {
        return [];
    }

    const range = document.createRange();
    const lineOffsets: Array<{start: number; end: number; top: number}> = [];

    for (let offset = 0; offset < text.length; offset++) {
        range.setStart(textNode, offset);
        range.setEnd(textNode, offset + 1);
        const rect = range.getBoundingClientRect();
        const currentLine = lineOffsets[lineOffsets.length - 1];

        if (!currentLine || Math.abs(rect.top - currentLine.top) > LINE_POSITION_TOLERANCE) {
            lineOffsets.push({start: offset, end: offset + 1, top: rect.top});
        } else {
            currentLine.end = offset + 1;
        }
    }

    return lineOffsets.flatMap(({start, end}) => {
        while (start < end && /\s/.test(text[start])) {
            start++;
        }
        while (end > start && /\s/.test(text[end - 1])) {
            end--;
        }

        if (start === end) {
            return [];
        }

        range.setStart(textNode, start);
        range.setEnd(textNode, end);
        const rect = range.getBoundingClientRect();

        return [{
            text: text.slice(start, end),
            x: rect.left,
            y: rect.top,
            height: rect.height,
        }];
    });
};

const createSvgText = (
    ownerDocument: Document,
    text: string,
    x: number,
    y: number,
    style: CSSStyleDeclaration,
) => {
    const textElement = ownerDocument.createElementNS(SVG_NAMESPACE, "text");
    textElement.setAttribute("x", String(x));
    textElement.setAttribute("y", String(y));
    textElement.setAttribute("fill", style.color);
    textElement.setAttribute("font-family", style.fontFamily);
    textElement.setAttribute("font-size", style.fontSize);
    textElement.setAttribute("font-style", style.fontStyle);
    textElement.setAttribute("font-weight", style.fontWeight);
    textElement.setAttribute("dominant-baseline", "text-before-edge");
    textElement.setAttribute("pointer-events", "none");
    textElement.textContent = text;
    return textElement;
};

// Canvg does not render HTML foreignObjects, so list labels are converted on an SVG clone for PNG export.
export const prepareSvgForPng = (svgElement: SVGSVGElement) => {
    const exportSvg = svgElement.cloneNode(true) as SVGSVGElement;
    const liveForeignObjects = Array.from(svgElement.querySelectorAll("foreignObject"));
    const exportForeignObjects = Array.from(exportSvg.querySelectorAll("foreignObject"));

    liveForeignObjects.forEach((foreignObject, index) => {
        const listItems = Array.from(foreignObject.querySelectorAll("li"));
        const exportForeignObject = exportForeignObjects[index];
        const parent = foreignObject.parentElement as SVGGraphicsElement | null;
        const parentMatrix = parent?.getScreenCTM()?.inverse();

        if (listItems.length === 0 || !exportForeignObject || !parentMatrix) {
            return;
        }

        const replacement = exportSvg.ownerDocument.createElementNS(SVG_NAMESPACE, "g");

        listItems.forEach(listItem => {
            const style = getComputedStyle(listItem);
            const lines = getTextLines(listItem);

            lines.forEach((line, lineIndex) => {
                const point = svgElement.createSVGPoint();
                point.x = line.x;
                point.y = line.y;
                const localPoint = point.matrixTransform(parentMatrix);

                if (lineIndex === 0) {
                    const bulletPoint = svgElement.createSVGPoint();
                    bulletPoint.x = line.x - line.height * BULLET_OFFSET_RATIO;
                    bulletPoint.y = line.y;
                    const localBulletPoint = bulletPoint.matrixTransform(parentMatrix);

                    replacement.appendChild(createSvgText(
                        exportSvg.ownerDocument,
                        "•",
                        localBulletPoint.x,
                        localBulletPoint.y,
                        style,
                    ));
                }

                replacement.appendChild(createSvgText(
                    exportSvg.ownerDocument,
                    line.text,
                    localPoint.x,
                    localPoint.y,
                    style,
                ));
            });
        });

        exportForeignObject.replaceWith(replacement);
    });

    const background = exportSvg.ownerDocument.createElementNS(SVG_NAMESPACE, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "white");
    exportSvg.insertBefore(background, exportSvg.firstChild);

    return exportSvg;
};
