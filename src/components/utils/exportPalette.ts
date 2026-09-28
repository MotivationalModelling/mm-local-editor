// Palette, type stack and avatar helpers for the exported SVG/PNG artifacts
// (the goal-feedback panel in pngFeedbackAnnotations.ts).
//
// Match the classic editor's white, grey and blue palette in exported images.

export const EXPORT_FONT_FAMILY =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const EXPORT_COLORS = {
    paper: "#f8f9fa",
    surface: "#ffffff",
    ink: "#212529",
    body: "#212529",
    muted: "#6c757d",
    eyebrow: "#6c757d",
    line: "#dee2e6",
    accent: "#0d6efd",
    accentSoft: "#e7f1ff",
    openText: "#0a58ca",
    openBackground: "#e7f1ff",
    resolvedText: "#0f5132",
    resolvedBackground: "#d1e7dd",
    replyBackground: "#f8f9fa",
    replyRule: "#cfe2ff",
    bubbleFill: "#f8f9fa",
    white: "#ffffff",
    // Shadows are RGBA because they are washed over whatever is underneath.
    cardShadow: "rgba(33, 37, 41, 0.08)",
    badgeShadow: "rgba(13, 110, 253, 0.18)"
};

export const EXPORT_AVATAR_COLORS = [
    "#0d6efd",
    "#b7771e",
    "#397052",
    "#9f352d",
    "#2c6e9e",
    "#71486d"
];

const hashString = (input: string): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
};

// Deterministic so the same author keeps the same disc across exports.
export const exportAvatarColor = (author: string): string =>
    EXPORT_AVATAR_COLORS[hashString(author.trim()) % EXPORT_AVATAR_COLORS.length];

export const exportAvatarInitial = (author: string): string =>
    (author.trim().charAt(0) || "?").toUpperCase();

// Canvas shadows are painted in device space, so a blur tuned for a 1x
// preview has to be scaled up when the export draws under a pixel-density
// transform. Everything else (line widths, radii) scales with the context.
export const getContextScale = (context: CanvasRenderingContext2D): number => {
    if (typeof context.getTransform !== "function") {
        return 1;
    }

    const scale = context.getTransform().a;

    return Number.isFinite(scale) && scale > 0 ? scale : 1;
};
