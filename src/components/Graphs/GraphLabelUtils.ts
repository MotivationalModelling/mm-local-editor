const HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => HTML_ENTITIES[character]);

// Normalized label areas keep list content inside each irregular shape.
export const LIST_LABEL_AREAS = {
    heartShape: {x: 0.18, y: 0.2, width: 0.64, height: 0.5},
    negativeShape: {x: 0.12, y: 0.36, width: 0.76, height: 0.52},
    cloudShape: {x: 0.2, y: 0.24, width: 0.6, height: 0.54},
} as const;

export const getListLabelArea = (shape: string) => (
    LIST_LABEL_AREAS[shape as keyof typeof LIST_LABEL_AREAS]
);

export function makeHtmlListLabel(items: string[]): string {
    const listItems = items
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join("");

    // The full-height wrapper centres the list within the shape-specific label area.
    return listItems ? `<div style="align-items:center;box-sizing:border-box;display:flex;height:100%;width:100%"><ul style="box-sizing:border-box;display:block;margin:0;overflow-wrap:anywhere;padding-left:1.2em;text-align:left;white-space:normal;width:100%">${listItems}</ul></div>` : "";
}
