import type {Cell} from "@maxgraph/core";

// HTML text encoding is different from URI encoding. Keep the mapping local
// and use it directly so adding an entity never requires updating a regex.
const encodeHtml = (value: string): string => {
    const htmlEncodings: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };
    return Array.from(value, character => htmlEncodings[character] ?? character).join("");
};

// This is the existing stored label format, not CSV. Keep empty entries so the
// edit validation can still detect missing goal names and changed item counts.
export const convertEditingValueToList = (value: string): string[] => value.split(",");
export const convertListToEditingValue = (items: string[]): string => items.join(",");

export const normalizeListLabelItems = (items: string[]): string[] => (
    // Match HTML parsing before measuring model text against rendered labels.
    // This affects presentation only; the stored editing value stays untouched.
    items.map(item => item.replace(/\r\n?/g, "\n").replace(/\0/g, "\uFFFD").trim())
        .filter(item => item.length > 0)
);

// The contenteditable buffer contains unsaved input that is not yet in graph
// or application state. Read it only when committing an edit, then serialize
// through the same format used by the model. null requests maxGraph's fallback
// for plain-text paste or replacement of the entire list.
export const readListEditorValue = (editor: HTMLElement): string | null => {
    const items = Array.from(editor.querySelectorAll("li"));
    if (items.length > 0) {
        return convertListToEditingValue(items.map(item => item.textContent?.trim() ?? ""));
    } else {
        return null;
    }
};

// Normalized label areas keep list content inside each irregular shape.
export const LIST_LABEL_AREAS = {
    heartShape: {x: 0.18, y: 0.2, width: 0.64, height: 0.5},
    negativeShape: {x: 0.12, y: 0.36, width: 0.76, height: 0.52},
    cloudShape: {x: 0.2, y: 0.24, width: 0.6, height: 0.54},
} as const;

export const getListLabelArea = (shape: string) => (
    LIST_LABEL_AREAS[shape as keyof typeof LIST_LABEL_AREAS]
);

// List labels are a subset of non-functional cells: stakeholder labels are
// intentionally excluded even though their cells are also non-functional.
export const isListLabelCell = (cell: Pick<Cell, "getStyle">): boolean => (
    getListLabelArea(cell.getStyle().shape ?? "") !== undefined
);

export function makeHtmlListLabel(items: string[]): string {
    const listItems = normalizeListLabelItems(items)
        .map(item => `<li>${encodeHtml(item)}</li>`)
        .join("");

    // The full-height wrapper centres the list within the shape-specific label area.
    return listItems ? `<div style="align-items:center;box-sizing:border-box;display:flex;height:100%;width:100%"><ul style="box-sizing:border-box;display:block;margin:0;overflow-wrap:anywhere;padding-left:1.2em;text-align:left;white-space:normal;width:100%">${listItems}</ul></div>` : "";
}
