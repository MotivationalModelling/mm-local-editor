import type {Cell} from "@maxgraph/core";

// Quote punctuation-bearing fields; unquoted legacy lists remain supported.
// Keep empty fields so edit validation can reject missing goal names.
export const convertListToEditingValue = (items: string[], separator = ","): string => items
    .map(item => /[",]/.test(item) ? `"${item.replace(/"/g, '""')}"` : item)
    .join(separator);

export const convertEditingValueToList = (value: string): string[] => {
    const items: string[] = [];
    let offset = 0;
    while (offset <= value.length) {
        // Only a quote at the beginning of a field starts a quoted value.
        const field = /^\s*"((?:[^"]|"")*)"\s*(,|$)/.exec(value.slice(offset));
        if (field) {
            items.push(field[1].replace(/""/g, '"'));
            offset += field[0].length;
            if (!field[2]) break;
        } else {
            const comma = value.indexOf(",", offset);
            if (comma === -1) {
                items.push(value.slice(offset));
                break;
            }
            items.push(value.slice(offset, comma));
            offset = comma + 1;
        }
    }
    return items;
};

export const normaliseListLabelItems = (items: string[]): string[] => (
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
