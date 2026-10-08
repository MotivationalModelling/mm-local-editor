import type {Feedback, OverallFeedback} from "../types";

import {
    EXPORT_COLORS,
    EXPORT_FONT_FAMILY,
    exportAvatarColor,
    exportAvatarInitial,
    getContextScale
} from "./exportPalette";

// Renderer for the goal-feedback panel on the exported PNG: one numbered
// section per goal carrying feedback, one card per comment. It is measured
// with the export's own canvas context before drawing, so the panel can be
// sized and the PNG canvas grown before anything is painted.
//
// The design language mirrors the in-app feedback panel (eyebrow + title
// header, status pill, author disc, soft-shadowed cards) using the export
// palette shared with the overall-feedback bubble.

export const PNG_FEEDBACK_PANEL_GAP = 28;
export const PNG_FEEDBACK_PANEL_WIDTH = 440;
export const MAX_EXPORTED_GOAL_FEEDBACK = 3;
const MAX_EXPORTED_REPLIES = 2;

const PANEL_PADDING = 28;
const PANEL_CONTENT_WIDTH = PNG_FEEDBACK_PANEL_WIDTH - PANEL_PADDING * 2;

// Header block: eyebrow, title, hairline rule, then the sections.
const EYEBROW_TOP = PANEL_PADDING;
const EYEBROW_HEIGHT = 13;
const EYEBROW_TRACKING = 1.3;
const TITLE_TOP = EYEBROW_TOP + EYEBROW_HEIGHT + 8;
const TITLE_HEIGHT = 27;
const HEADER_RULE_Y = TITLE_TOP + TITLE_HEIGHT + 22;
const GROUPS_TOP = HEADER_RULE_Y + 26;

// Goal sections.
const GROUP_RADIUS = 12;
const GROUP_HEADER_GAP = 12;
const GROUP_META_GAP = 20;
const GROUP_TO_CARD_GAP = 14;
const GROUP_GAP = 22;

// Cards.
const CARD_PADDING = 18;
const CARD_RADIUS = 12;
const CARD_GAP = 12;
const CARD_CONTENT_WIDTH = PANEL_CONTENT_WIDTH - CARD_PADDING * 2;
const CARD_SHADOW_BLUR = 10;
const CARD_SHADOW_OFFSET_Y = 3;

const STATUS_HEIGHT = 20;
const STATUS_PADDING_X = 10;
const STATUS_DOT_RADIUS = 3;
const STATUS_DOT_GAP = 7;
const STATUS_TO_AUTHOR_GAP = 14;
const STATUS_TO_DATE_GAP = 12;

const AVATAR_SIZE = 24;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const AVATAR_GAP = 10;
const AUTHOR_TO_CONTENT_GAP = 13;

const REPLY_RULE_WIDTH = 2;
const REPLY_PADDING_X = 12;
const REPLY_PADDING_Y = 10;
const REPLY_RADIUS = 8;
const REPLY_GAP = 8;
const REPLY_TO_CONTENT_GAP = 12;
const REPLY_AUTHOR_GAP = 3;

const BADGE_RADIUS = 11;
const BADGE_RING_WIDTH = 2.5;
const BADGE_SHADOW_BLUR = 8;
const BADGE_SHADOW_OFFSET_Y = 2;

const TYPE = {
    eyebrow: {weight: 800, size: 9},
    title: {weight: 600, size: 20},
    headerMeta: {weight: 600, size: 11},
    groupNumber: {weight: 700, size: 11.5},
    groupLabel: {weight: 650, size: 13.5, lineHeight: 19},
    groupMeta: {weight: 500, size: 11},
    status: {weight: 700, size: 9.5},
    date: {weight: 500, size: 10.5},
    avatarInitial: {weight: 700, size: 11.5},
    author: {weight: 700, size: 12.5, lineHeight: 17},
    content: {weight: 400, size: 13, lineHeight: 19.5},
    overallContent: {weight: 400, size: 15, lineHeight: 23},
    replyAuthor: {weight: 700, size: 11.5, lineHeight: 16},
    replyContent: {weight: 400, size: 12, lineHeight: 18},
    badge: {weight: 700, size: 11}
};

const fontOf = (style: {weight: number; size: number}): string =>
    `${style.weight} ${style.size}px ${EXPORT_FONT_FAMILY}`;

// Vertical offsets inside a card. Measuring and drawing both read these, so a
// card's height can never disagree with what is painted into it.
const STATUS_TOP = CARD_PADDING;
const AUTHOR_TOP = STATUS_TOP + STATUS_HEIGHT + STATUS_TO_AUTHOR_GAP;
const contentTop = (authorRowHeight: number): number =>
    AUTHOR_TOP + authorRowHeight + AUTHOR_TO_CONTENT_GAP;

export interface FeedbackGroup {
    number: number;
    nodeId: string;
    nodeLabel: string;
    feedbacks: Feedback[];
}

interface FeedbackReplyLayout {
    authorLines: string[];
    contentLines: string[];
}

interface FeedbackCardLayout {
    feedback: Feedback;
    top: number;
    height: number;
    authorLines: string[];
    contentLines: string[];
    replies: FeedbackReplyLayout[];
    hiddenReplyCount: number;
    date: string;
    dateWidth: number;
}

interface OverallFeedbackLayout {
    feedback: OverallFeedback;
    labelTop: number;
    cardTop: number;
    cardHeight: number;
    authorLines: string[];
    contentLines: string[];
}

interface FeedbackGroupLayout {
    group: FeedbackGroup;
    top: number;
    headerHeight: number;
    labelLines: string[];
    meta: string;
    cards: FeedbackCardLayout[];
}

export interface FeedbackPanelLayout {
    width: number;
    height: number;
    feedbackCount: number;
    openCount: number;
    meta: string;
    groups: FeedbackGroupLayout[];
    overall?: OverallFeedbackLayout;
    goalHeadingTop?: number;
    hiddenCount: number;
}

export interface GraphNodeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FeedbackNodeBadge {
    number: number;
    x: number;
    y: number;
}

export interface ExportPoint {
    x: number;
    y: number;
}

export interface PngExportDimensions {
    width: number;
    height: number;
    hasFeedbackPanel: boolean;
}

type NodeLabelResolver = (nodeId: string) => string | null | undefined;
type NodeBoundsResolver = (nodeId: string) => GraphNodeBounds | null | undefined;
type PointConverter = (point: ExportPoint) => ExportPoint;

const getExplicitNodeLabel = (feedbacks: Feedback[]): string | undefined =>
    feedbacks
        .map((feedback) => feedback.nodeLabel?.trim())
        .find((label): label is string => Boolean(label));

/**
 * Groups feedback by the first occurrence of each node id. Map insertion order
 * makes both the group numbering and the panel order deterministic.
 */
export const groupFeedbackByNode = (
    feedbacks: Feedback[],
    resolveNodeLabel: NodeLabelResolver = () => undefined
): FeedbackGroup[] => {
    const groupedFeedback = new Map<string, Feedback[]>();

    feedbacks.forEach((feedback) => {
        const group = groupedFeedback.get(feedback.nodeId);

        if (group) {
            group.push(feedback);
        } else {
            groupedFeedback.set(feedback.nodeId, [feedback]);
        }
    });

    return Array.from(groupedFeedback.entries()).map(
        ([nodeId, nodeFeedbacks], index) => {
            const resolvedLabel = resolveNodeLabel(nodeId)?.trim();

            return {
                number: index + 1,
                nodeId,
                nodeLabel:
                    getExplicitNodeLabel(nodeFeedbacks) ??
                    (resolvedLabel || nodeId),
                feedbacks: nodeFeedbacks
            };
        }
    );
};

const splitLongToken = (
    context: CanvasRenderingContext2D,
    token: string,
    maxWidth: number
): string[] => {
    const chunks: string[] = [];
    let chunk = "";

    Array.from(token).forEach((character) => {
        const candidate = chunk + character;

        if (chunk && context.measureText(candidate).width > maxWidth) {
            chunks.push(chunk);
            chunk = character;
        } else {
            chunk = candidate;
        }
    });

    if (chunk) {
        chunks.push(chunk);
    }

    return chunks;
};

/**
 * Wraps normal prose at whitespace while still splitting CJK text and long
 * uninterrupted strings by Unicode code point so content can never overflow.
 */
export const wrapCanvasText = (
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] => {
    const lines: string[] = [];

    text.replace(/\r\n?/g, "\n").split("\n").forEach((paragraph) => {
        if (!paragraph) {
            lines.push("");
            return;
        }

        const tokens = paragraph.match(/\s+|[^\s]+/gu) ?? [];
        let currentLine = "";

        tokens.forEach((token) => {
            if (/^\s+$/u.test(token)) {
                if (
                    currentLine &&
                    context.measureText(currentLine + token).width <= maxWidth
                ) {
                    currentLine += token;
                }
                return;
            }

            const candidate = currentLine + token;

            if (context.measureText(candidate).width <= maxWidth) {
                currentLine = candidate;
                return;
            }

            if (currentLine) {
                lines.push(currentLine.trimEnd());
                currentLine = "";
            }

            if (context.measureText(token).width <= maxWidth) {
                currentLine = token;
                return;
            }

            const chunks = splitLongToken(context, token, maxWidth);
            lines.push(...chunks.slice(0, -1));
            currentLine = chunks[chunks.length - 1] ?? "";
        });

        lines.push(currentLine.trimEnd());
    });

    return lines;
};

const getWrappedLines = (
    context: CanvasRenderingContext2D,
    text: string,
    font: string,
    maxWidth: number
): string[] => {
    context.font = font;
    return wrapCanvasText(context, text, Math.max(maxWidth, 40));
};

// Older example projects store the Unix epoch as an unknown-date sentinel;
// showing "1 Jan 1970" on a card would be noise.
const formatFeedbackDate = (createdAt: string): string => {
    if (!createdAt?.trim()) {
        return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
        return "";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};

const countLabel = (count: number): string =>
    `${count} comment${count === 1 ? "" : "s"}`;

const isOpen = (feedback: Feedback): boolean => feedback.status !== "resolved";

const calculateCardLayout = (
    context: CanvasRenderingContext2D,
    feedback: Feedback,
    top: number
): FeedbackCardLayout => {
    const authorLines = getWrappedLines(
        context,
        feedback.author,
        fontOf(TYPE.author),
        CARD_CONTENT_WIDTH - AVATAR_SIZE - AVATAR_GAP
    );
    const contentLines = getWrappedLines(
        context,
        feedback.content,
        fontOf(TYPE.content),
        CARD_CONTENT_WIDTH
    );
    const replyWidth =
        CARD_CONTENT_WIDTH -
        REPLY_RULE_WIDTH -
        REPLY_PADDING_X * 2;
    const replies = (feedback.replies ?? []).slice(0, MAX_EXPORTED_REPLIES).map((reply) => ({
        authorLines: getWrappedLines(
            context,
            reply.author,
            fontOf(TYPE.replyAuthor),
            replyWidth
        ),
        contentLines: getWrappedLines(
            context,
            reply.content,
            fontOf(TYPE.replyContent),
            replyWidth
        )
    }));
    const hiddenReplyCount = Math.max(0, (feedback.replies?.length ?? 0) - replies.length);

    const date = formatFeedbackDate(feedback.createdAt);
    context.font = fontOf(TYPE.date);
    const dateWidth = date ? context.measureText(date).width : 0;

    const authorRowHeight = Math.max(
        AVATAR_SIZE,
        authorLines.length * TYPE.author.lineHeight
    );
    let height = contentTop(authorRowHeight);
    height += contentLines.length * TYPE.content.lineHeight;

    if (replies.length > 0) {
        height += REPLY_TO_CONTENT_GAP;
        replies.forEach((reply, index) => {
            if (index > 0) {
                height += REPLY_GAP;
            }
            height += REPLY_PADDING_Y * 2;
            height += reply.authorLines.length * TYPE.replyAuthor.lineHeight;
            height += REPLY_AUTHOR_GAP;
            height += reply.contentLines.length * TYPE.replyContent.lineHeight;
        });
    }

    if (hiddenReplyCount > 0) height += 18;

    height += CARD_PADDING;

    return {
        feedback,
        top,
        height,
        authorLines,
        contentLines,
        replies,
        hiddenReplyCount,
        date,
        dateWidth
    };
};

export const calculateFeedbackPanelLayout = (
    context: CanvasRenderingContext2D,
    groups: FeedbackGroup[],
    overallFeedback?: OverallFeedback,
    totalGoalFeedbackCount = groups.reduce((count, group) => count + group.feedbacks.length, 0)
): FeedbackPanelLayout => {
    context.save();

    let overall: OverallFeedbackLayout | undefined;
    if (overallFeedback?.content.trim()) {
        const authorLines = getWrappedLines(context, overallFeedback.author, fontOf(TYPE.author), CARD_CONTENT_WIDTH - 46);
        const contentLines = getWrappedLines(context, overallFeedback.content, fontOf(TYPE.overallContent), CARD_CONTENT_WIDTH);
        const labelTop = GROUPS_TOP;
        const cardTop = labelTop + 26;
        const cardHeight = 20 + Math.max(34, authorLines.length * TYPE.author.lineHeight) + 15
            + contentLines.length * TYPE.overallContent.lineHeight + 22;
        overall = {feedback: overallFeedback, labelTop, cardTop, cardHeight, authorLines, contentLines};
    }

    context.font = fontOf(TYPE.groupMeta);
    const metaWidth = groups.reduce(
        (widest, group) =>
            Math.max(widest, context.measureText(countLabel(group.feedbacks.length)).width),
        0
    );
    const labelMaxWidth =
        PANEL_CONTENT_WIDTH -
        GROUP_RADIUS * 2 -
        GROUP_HEADER_GAP -
        metaWidth -
        GROUP_META_GAP;

    const goalHeadingTop = groups.length > 0
        ? overall ? overall.cardTop + overall.cardHeight + 36 : GROUPS_TOP
        : undefined;
    let cursor = goalHeadingTop === undefined ? (overall ? overall.cardTop + overall.cardHeight + 24 : GROUPS_TOP)
        : goalHeadingTop + 33;
    const groupLayouts = groups.map((group) => {
        const labelLines = getWrappedLines(
            context,
            group.nodeLabel,
            fontOf(TYPE.groupLabel),
            labelMaxWidth
        );
        const headerHeight = Math.max(
            GROUP_RADIUS * 2,
            labelLines.length * TYPE.groupLabel.lineHeight
        );
        let cardTop = cursor + headerHeight + GROUP_TO_CARD_GAP;
        const cards = group.feedbacks.map((feedback) => {
            const card = calculateCardLayout(context, feedback, cardTop);
            cardTop += card.height + CARD_GAP;
            return card;
        });

        const layout = {
            group,
            top: cursor,
            headerHeight,
            labelLines,
            meta: countLabel(group.feedbacks.length),
            cards
        };

        cursor = cardTop - CARD_GAP + GROUP_GAP;
        return layout;
    });

    const shownCount = groups.reduce((count, group) => count + group.feedbacks.length, 0);
    const hiddenCount = Math.max(0, totalGoalFeedbackCount - shownCount);
    if (hiddenCount > 0) cursor += 22;
    context.restore();

    return {
        width: PNG_FEEDBACK_PANEL_WIDTH,
        height: Math.max(GROUPS_TOP + 24, cursor),
        feedbackCount: shownCount,
        openCount: groups.reduce(
            (count, group) =>
                count +
                group.feedbacks.filter((feedback) => isOpen(feedback)).length,
            0
        ),
        meta: totalGoalFeedbackCount > 0 ? countLabel(totalGoalFeedbackCount) : "Model review",
        groups: groupLayouts,
        overall,
        goalHeadingTop,
        hiddenCount,
    };
};

export const calculatePngExportDimensions = (
    graphWidth: number,
    graphHeight: number,
    panelLayout: FeedbackPanelLayout | null
): PngExportDimensions => {
    if (!panelLayout) {
        return {
            width: graphWidth,
            height: graphHeight,
            hasFeedbackPanel: false
        };
    }

    return {
        width: graphWidth + PNG_FEEDBACK_PANEL_GAP + panelLayout.width,
        height: Math.max(graphHeight, panelLayout.height),
        hasFeedbackPanel: true
    };
};

export const getFeedbackNodeBadges = (
    groups: FeedbackGroup[],
    resolveNodeBounds: NodeBoundsResolver,
    convertPoint: PointConverter = (point) => point
): FeedbackNodeBadge[] =>
    groups.flatMap((group) => {
        const bounds = resolveNodeBounds(group.nodeId);

        if (!bounds) {
            return [];
        }

        const point = convertPoint({
            x: bounds.x + bounds.width,
            y: bounds.y
        });

        return [{number: group.number, x: point.x, y: point.y}];
    });

/**
 * Cell states live in the graph view's coordinates, while the exported image
 * is drawn at the graph's own scale, centred horizontally and padded.
 * Reproducing that transform is what keeps a badge on its node: an overlay
 * drawn with the export's own arithmetic cannot drift from the graph the way
 * a mapping through the on-screen SVG can once the user has zoomed or panned.
 */
export const createGraphToExportPointConverter = (
    bounds: GraphNodeBounds,
    viewScale: number,
    exportWidth: number,
    padding: number
): PointConverter => {
    const finite = [
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        viewScale,
        exportWidth,
        padding
    ].every(Number.isFinite);

    if (!finite || viewScale <= 0) {
        return (point) => point;
    }

    const offsetX = (exportWidth - bounds.width / viewScale) / 2;

    return (point) => ({
        x: (point.x - bounds.x) / viewScale + offsetX,
        y: (point.y - bounds.y) / viewScale + padding
    });
};

const roundedRectPath = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void => {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));

    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
};

// Quoted replies hug their rule on the left and round only on the right, the
// same shape the in-app reply block uses.
const roundedRightRectPath = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void => {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width - r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.lineTo(x, y + height);
    context.closePath();
};

const drawDisc = (
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    fill: string,
    label: string,
    font: string,
    labelColor: string
): void => {
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();

    context.font = font;
    context.fillStyle = labelColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, cx, cy + 0.5);
    context.textAlign = "left";
};

const drawAuthorAvatar = (
    context: CanvasRenderingContext2D,
    author: string,
    cx: number,
    cy: number,
    radius: number,
    avatars: ReadonlyMap<string, HTMLImageElement>
): void => {
    const image = avatars.get(author);
    if (!image) {
        drawDisc(context, cx, cy, radius, exportAvatarColor(author), exportAvatarInitial(author),
            fontOf(TYPE.avatarInitial), EXPORT_COLORS.white);
        return;
    }
    context.save();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, cx - radius, cy - radius, radius * 2, radius * 2);
    context.restore();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    context.stroke();
};

// Draws each character itself so the letter-spacing of the eyebrow does not
// depend on the experimental canvas letterSpacing property.
const drawTrackedText = (
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    tracking: number
): void => {
    let cursor = x;

    Array.from(text).forEach((character, index) => {
        if (index > 0) {
            cursor += tracking;
        }

        context.fillText(character, cursor, y);
        cursor += context.measureText(character).width;
    });
};

const drawLines = (
    context: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    y: number,
    lineHeight: number
): void => {
    lines.forEach((line, index) => {
        context.fillText(line, x, y + index * lineHeight);
    });
};

export const drawFeedbackNodeBadges = (
    context: CanvasRenderingContext2D,
    badges: FeedbackNodeBadge[],
    ringColor: string = EXPORT_COLORS.white
) => {
    context.save();
    const scale = getContextScale(context);

    badges.forEach((badge) => {
        context.save();
        context.shadowColor = EXPORT_COLORS.badgeShadow;
        context.shadowBlur = BADGE_SHADOW_BLUR * scale;
        context.shadowOffsetY = BADGE_SHADOW_OFFSET_Y * scale;
        context.beginPath();
        context.arc(badge.x, badge.y, BADGE_RADIUS, 0, Math.PI * 2);
        context.fillStyle = EXPORT_COLORS.accent;
        context.fill();
        context.restore();

        // The ring takes the graph's own background colour so a badge reads
        // against whatever node it is pinned to.
        context.beginPath();
        context.arc(badge.x, badge.y, BADGE_RADIUS, 0, Math.PI * 2);
        context.strokeStyle = ringColor;
        context.lineWidth = BADGE_RING_WIDTH;
        context.stroke();

        context.font = fontOf(TYPE.badge);
        context.fillStyle = EXPORT_COLORS.white;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(badge.number), badge.x, badge.y + 0.5);
        context.textAlign = "left";
    });

    context.restore();
};

const drawStatusPill = (
    context: CanvasRenderingContext2D,
    card: FeedbackCardLayout,
    x: number,
    y: number
): number => {
    const resolved = !isOpen(card.feedback);
    const label = resolved ? "Resolved" : "Open";
    const fill = resolved
        ? EXPORT_COLORS.resolvedBackground
        : EXPORT_COLORS.openBackground;
    const ink = resolved
        ? EXPORT_COLORS.resolvedText
        : EXPORT_COLORS.openText;

    context.font = fontOf(TYPE.status);
    const labelWidth = context.measureText(label).width;
    const width =
        STATUS_PADDING_X * 2 +
        STATUS_DOT_RADIUS * 2 +
        STATUS_DOT_GAP +
        labelWidth;

    roundedRectPath(context, x, y, width, STATUS_HEIGHT, STATUS_HEIGHT / 2);
    context.fillStyle = fill;
    context.fill();

    context.beginPath();
    context.arc(
        x + STATUS_PADDING_X + STATUS_DOT_RADIUS,
        y + STATUS_HEIGHT / 2,
        STATUS_DOT_RADIUS,
        0,
        Math.PI * 2
    );
    context.fillStyle = ink;
    context.fill();

    context.fillStyle = ink;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(
        label,
        x + STATUS_PADDING_X + STATUS_DOT_RADIUS * 2 + STATUS_DOT_GAP,
        y + STATUS_HEIGHT / 2 + 0.5
    );

    return width;
};

const drawFeedbackCard = (
    context: CanvasRenderingContext2D,
    card: FeedbackCardLayout,
    panelX: number,
    avatars: ReadonlyMap<string, HTMLImageElement>
): void => {
    const cardX = panelX + PANEL_PADDING;
    const textX = cardX + CARD_PADDING;
    const scale = getContextScale(context);

    context.save();
    context.shadowColor = EXPORT_COLORS.cardShadow;
    context.shadowBlur = CARD_SHADOW_BLUR * scale;
    context.shadowOffsetY = CARD_SHADOW_OFFSET_Y * scale;
    roundedRectPath(
        context,
        cardX,
        card.top,
        PANEL_CONTENT_WIDTH,
        card.height,
        CARD_RADIUS
    );
    context.fillStyle = EXPORT_COLORS.surface;
    context.fill();
    context.restore();

    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    roundedRectPath(
        context,
        cardX + 0.5,
        card.top + 0.5,
        PANEL_CONTENT_WIDTH - 1,
        card.height - 1,
        CARD_RADIUS - 0.5
    );
    context.stroke();

    const statusY = card.top + STATUS_TOP;
    const statusWidth = drawStatusPill(context, card, textX, statusY);

    if (
        card.date &&
        statusWidth + STATUS_TO_DATE_GAP + card.dateWidth <= CARD_CONTENT_WIDTH
    ) {
        context.font = fontOf(TYPE.date);
        context.fillStyle = EXPORT_COLORS.muted;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(
            card.date,
            cardX + PANEL_CONTENT_WIDTH - CARD_PADDING,
            statusY + STATUS_HEIGHT / 2 + 0.5
        );
        context.textAlign = "left";
    }

    const authorRowHeight = Math.max(
        AVATAR_SIZE,
        card.authorLines.length * TYPE.author.lineHeight
    );
    const avatarCy = card.top + AUTHOR_TOP + Math.max(AVATAR_SIZE, authorRowHeight) / 2;
    const avatarCx = textX + AVATAR_RADIUS;

    drawAuthorAvatar(context, card.feedback.author, avatarCx, avatarCy, AVATAR_RADIUS, avatars);

    context.font = fontOf(TYPE.author);
    context.fillStyle = EXPORT_COLORS.ink;
    context.textAlign = "left";
    context.textBaseline = "middle";
    drawLines(
        context,
        card.authorLines,
        textX + AVATAR_SIZE + AVATAR_GAP,
        avatarCy - ((card.authorLines.length - 1) * TYPE.author.lineHeight) / 2,
        TYPE.author.lineHeight
    );

    context.font = fontOf(TYPE.content);
    context.fillStyle = EXPORT_COLORS.body;
    context.textBaseline = "top";
    const bodyTop = card.top + contentTop(authorRowHeight);
    drawLines(
        context,
        card.contentLines,
        textX,
        bodyTop,
        TYPE.content.lineHeight
    );

    if (card.replies.length === 0) {
        return;
    }

    let replyTop =
        bodyTop +
        card.contentLines.length * TYPE.content.lineHeight +
        REPLY_TO_CONTENT_GAP;

    card.replies.forEach((reply, index) => {
        if (index > 0) {
            replyTop += REPLY_GAP;
        }

        const replyHeight =
            REPLY_PADDING_Y * 2 +
            reply.authorLines.length * TYPE.replyAuthor.lineHeight +
            REPLY_AUTHOR_GAP +
            reply.contentLines.length * TYPE.replyContent.lineHeight;

        roundedRightRectPath(
            context,
            textX,
            replyTop,
            CARD_CONTENT_WIDTH,
            replyHeight,
            REPLY_RADIUS
        );
        context.fillStyle = EXPORT_COLORS.replyBackground;
        context.fill();

        context.fillStyle = EXPORT_COLORS.replyRule;
        context.fillRect(textX, replyTop, REPLY_RULE_WIDTH, replyHeight);

        const replyX = textX + REPLY_RULE_WIDTH + REPLY_PADDING_X;
        const replyTextTop = replyTop + REPLY_PADDING_Y;

        context.font = fontOf(TYPE.replyAuthor);
        context.fillStyle = EXPORT_COLORS.accent;
        context.textBaseline = "top";
        drawLines(
            context,
            reply.authorLines,
            replyX,
            replyTextTop,
            TYPE.replyAuthor.lineHeight
        );

        const replyBodyTop =
            replyTextTop +
            reply.authorLines.length * TYPE.replyAuthor.lineHeight +
            REPLY_AUTHOR_GAP;

        context.font = fontOf(TYPE.replyContent);
        context.fillStyle = EXPORT_COLORS.body;
        drawLines(
            context,
            reply.contentLines,
            replyX,
            replyBodyTop,
            TYPE.replyContent.lineHeight
        );

        replyTop += replyHeight;
    });
    if (card.hiddenReplyCount > 0) {
        context.font = fontOf(TYPE.date);
        context.fillStyle = EXPORT_COLORS.muted;
        context.fillText(`+ ${card.hiddenReplyCount} more replies`, textX, replyTop + 5);
    }
};

const drawOverallFeedback = (
    context: CanvasRenderingContext2D,
    layout: OverallFeedbackLayout,
    panelX: number,
    avatars: ReadonlyMap<string, HTMLImageElement>
): void => {
    const cardX = panelX + PANEL_PADDING;
    const contentX = cardX + CARD_PADDING;
    context.font = fontOf(TYPE.eyebrow);
    context.fillStyle = EXPORT_COLORS.accent;
    drawTrackedText(context, "OVERALL FEEDBACK", cardX, layout.labelTop, 1.1);

    roundedRectPath(context, cardX, layout.cardTop, PANEL_CONTENT_WIDTH, layout.cardHeight, CARD_RADIUS);
    context.fillStyle = EXPORT_COLORS.surface;
    context.fill();
    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    context.stroke();

    const authorTop = layout.cardTop + 20;
    const avatarRadius = 17;
    const avatarCy = authorTop + avatarRadius;
    drawAuthorAvatar(context, layout.feedback.author, contentX + avatarRadius, avatarCy, avatarRadius, avatars);

    context.font = fontOf(TYPE.author);
    context.fillStyle = EXPORT_COLORS.ink;
    context.textBaseline = "middle";
    drawLines(context, layout.authorLines, contentX + 46,
        avatarCy - ((layout.authorLines.length - 1) * TYPE.author.lineHeight) / 2,
        TYPE.author.lineHeight);

    const bodyTop = authorTop + Math.max(34, layout.authorLines.length * TYPE.author.lineHeight) + 15;
    context.font = fontOf(TYPE.overallContent);
    context.fillStyle = EXPORT_COLORS.body;
    context.textBaseline = "top";
    drawLines(context, layout.contentLines, contentX, bodyTop, TYPE.overallContent.lineHeight);
};

export const drawFeedbackPanel = (
    context: CanvasRenderingContext2D,
    layout: FeedbackPanelLayout,
    panelX: number,
    canvasHeight: number,
    avatars: ReadonlyMap<string, HTMLImageElement> = new Map()
) => {
    context.save();
    context.textAlign = "left";
    context.textBaseline = "top";

    context.fillStyle = EXPORT_COLORS.paper;
    context.fillRect(panelX, 0, layout.width, canvasHeight);
    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(panelX + 0.5, 0);
    context.lineTo(panelX + 0.5, canvasHeight);
    context.stroke();

    context.font = fontOf(TYPE.eyebrow);
    context.fillStyle = EXPORT_COLORS.eyebrow;
    drawTrackedText(
        context,
        "REVIEW",
        panelX + PANEL_PADDING,
        EYEBROW_TOP,
        EYEBROW_TRACKING
    );

    context.font = fontOf(TYPE.headerMeta);
    context.fillStyle = EXPORT_COLORS.muted;
    context.textAlign = "right";
    context.fillText(
        layout.meta,
        panelX + layout.width - PANEL_PADDING,
        EYEBROW_TOP + 1
    );
    context.textAlign = "left";

    context.font = fontOf(TYPE.title);
    context.fillStyle = EXPORT_COLORS.ink;
    context.fillText("Model feedback", panelX + PANEL_PADDING, TITLE_TOP);

    context.strokeStyle = EXPORT_COLORS.line;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(panelX + PANEL_PADDING, HEADER_RULE_Y + 0.5);
    context.lineTo(panelX + layout.width - PANEL_PADDING, HEADER_RULE_Y + 0.5);
    context.stroke();

    if (layout.overall) {
        drawOverallFeedback(context, layout.overall, panelX, avatars);
    }

    if (layout.goalHeadingTop !== undefined) {
        context.font = fontOf(TYPE.eyebrow);
        context.fillStyle = EXPORT_COLORS.eyebrow;
        drawTrackedText(context, "GOAL FEEDBACK", panelX + PANEL_PADDING, layout.goalHeadingTop, 1.1);
        context.strokeStyle = EXPORT_COLORS.line;
        context.beginPath();
        context.moveTo(panelX + PANEL_PADDING, layout.goalHeadingTop + 21.5);
        context.lineTo(panelX + layout.width - PANEL_PADDING, layout.goalHeadingTop + 21.5);
        context.stroke();
    }

    layout.groups.forEach((groupLayout) => {
        const centerY = groupLayout.top + groupLayout.headerHeight / 2;

        drawDisc(
            context,
            panelX + PANEL_PADDING + GROUP_RADIUS,
            centerY,
            GROUP_RADIUS,
            EXPORT_COLORS.accent,
            String(groupLayout.group.number),
            fontOf(TYPE.groupNumber),
            EXPORT_COLORS.white
        );

        context.font = fontOf(TYPE.groupLabel);
        context.fillStyle = EXPORT_COLORS.ink;
        context.textAlign = "left";
        context.textBaseline = "middle";
        drawLines(
            context,
            groupLayout.labelLines,
            panelX + PANEL_PADDING + GROUP_RADIUS * 2 + GROUP_HEADER_GAP,
            centerY -
                ((groupLayout.labelLines.length - 1) *
                    TYPE.groupLabel.lineHeight) /
                    2,
            TYPE.groupLabel.lineHeight
        );

        context.font = fontOf(TYPE.groupMeta);
        context.fillStyle = EXPORT_COLORS.muted;
        context.textAlign = "right";
        context.fillText(
            groupLayout.meta,
            panelX + layout.width - PANEL_PADDING,
            centerY
        );
        context.textAlign = "left";

        groupLayout.cards.forEach((card) => {
            drawFeedbackCard(context, card, panelX, avatars);
        });
    });

    if (layout.hiddenCount > 0) {
        context.font = fontOf(TYPE.groupMeta);
        context.fillStyle = EXPORT_COLORS.muted;
        context.textBaseline = "top";
        context.fillText(`+ ${layout.hiddenCount} more goal comments in the model`,
            panelX + PANEL_PADDING, layout.height - 31);
    }

    context.restore();
};
