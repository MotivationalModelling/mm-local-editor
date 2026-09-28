import type {JSONData} from "../modelJson";
import type {Feedback, TreeGoal} from "../types";
import type {Project} from "./projects";
import {embedJsonInPng, embedJsonInSvg} from "./imageMetadata";
import {MAX_EXPORTED_GOAL_FEEDBACK} from "./pngFeedbackAnnotations";

type PositionedGoal = {goal: TreeGoal; x: number; y: number};
const xml = (value: string) => value.replace(/[&<>"']/g, (character) =>
    ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"}[character] ?? character));
const short = (value: string, length: number) =>
    value.length > length ? `${value.slice(0, length - 1)}…` : value;
const lines = (value: string, width: number, limit: number) => {
    const words = value.trim().split(/\s+/);
    const output: string[] = [];
    let line = "";
    words.forEach((word) => {
        if ((line + " " + word).trim().length > width && line) {
            output.push(line);
            line = "";
        }
        while (word.length > width) {
            output.push(word.slice(0, width));
            word = word.slice(width);
        }
        line = line ? `${line} ${word}` : word;
    });
    if (line) output.push(line);
    return output.length > limit ? [...output.slice(0, limit - 1), `${short(output[limit - 1], width - 1)}…`] : output;
};
const textLines = (items: string[], x: number, y: number, size = 15, gap = 22) =>
    items.map((line, index) => `<text x="${x}" y="${y + index * gap}" font-size="${size}" fill="#202833">${xml(line)}</text>`).join("");

export const projectToModelJson = (project: Project): JSONData => ({
    tabData: project.tabData.map((tab) => ({
        label: tab.label, icon: tab.icon, goalIds: tab.rows.map((goal) => goal.id),
    })),
    treeData: project.treeData,
    feedbacks: project.feedbacks,
    overallFeedback: project.overallFeedback,
});

const layoutGraph = (tree: TreeGoal[]) => {
    const doRoots = tree.filter((goal) => goal.type === "Do");
    const getDoChildren = (goal: TreeGoal) => (goal.children ?? []).filter((child) => child.type === "Do");
    const leafCount = (goal: TreeGoal): number => {
        const children = getDoChildren(goal);
        return children.length ? children.reduce((count, child) => count + leafCount(child), 0) : 1;
    };
    const leafTotal = doRoots.reduce((count, root) => count + leafCount(root), 0);
    const graphWidth = Math.max(800, leafTotal * 150 + 500);
    const positions: PositionedGoal[] = [];
    const edges: string[] = [];
    let nextLeaf = 0;
    let maxDepth = 0;
    const place = (goal: TreeGoal, depth: number): number => {
        maxDepth = Math.max(depth, maxDepth);
        const children = getDoChildren(goal);
        const childX = children.map((child) => place(child, depth + 1));
        const x = children.length ? (childX[0] + childX[childX.length - 1]) / 2
            : graphWidth / 2 - (leafTotal - 1) * 75 + nextLeaf++ * 150;
        const y = 205 + depth * 150;
        positions.push({goal, x, y});
        children.forEach((_, index) =>
            edges.push(`<path d="M ${x} ${y + 42} L ${childX[index]} ${y + 108}" stroke="#364252" stroke-width="2" fill="none"/>`));
        return x;
    };
    doRoots.forEach((root) => place(root, 0));
    const graphHeight = Math.max(510, 205 + maxDepth * 150 + 125);
    const firstRoot = positions.find((item) => item.goal === doRoots[0]);
    const adjuncts = tree.filter((goal) => goal.type !== "Do");
    const adjunctSlots = [
        {x: (firstRoot?.x ?? graphWidth / 2) - 190, y: 70},
        {x: (firstRoot?.x ?? graphWidth / 2) + 190, y: 70},
        {x: (firstRoot?.x ?? graphWidth / 2) - 190, y: 200},
        {x: (firstRoot?.x ?? graphWidth / 2) + 190, y: 200},
    ];
    adjuncts.slice(0, 4).forEach((goal, index) => {
        const slot = adjunctSlots[index];
        positions.push({goal, ...slot});
        if (firstRoot) edges.push(`<path d="M ${slot.x} ${slot.y + 36} L ${firstRoot.x} ${firstRoot.y}" stroke="#364252" stroke-width="1.5" stroke-dasharray="5 5" fill="none"/>`);
    });
    return {graphWidth, graphHeight, positions, edges};
};

const goalShape = ({goal, x, y}: PositionedGoal) => {
    const label = xml(short(goal.content || goal.type, 22));
    const text = `<text x="${x}" y="${y + 5}" font-size="17" text-anchor="middle" fill="#17212b">${label}</text>`;
    if (goal.type === "Do") return `<polygon points="${x - 55},${y - 40} ${x + 62},${y - 40} ${x + 55},${y + 40} ${x - 62},${y + 40}" fill="#fff" stroke="#18212c" stroke-width="2"/>${text}`;
    if (goal.type === "Be") return `<path d="M ${x - 48} ${y + 24} C ${x - 70} ${y + 10}, ${x - 50} ${y - 12}, ${x - 37} ${y - 10} C ${x - 27} ${y - 36}, ${x - 2} ${y - 30}, ${x + 3} ${y - 22} C ${x + 25} ${y - 42}, ${x + 47} ${y - 21}, ${x + 44} ${y - 6} C ${x + 68} ${y + 4}, ${x + 53} ${y + 30}, ${x + 34} ${y + 27} C ${x + 20} ${y + 43}, ${x + 2} ${y + 30}, ${x - 8} ${y + 28} C ${x - 22} ${y + 43}, ${x - 41} ${y + 33}, ${x - 48} ${y + 24} Z" fill="#fff" stroke="#18212c" stroke-width="2"/>${text}`;
    if (goal.type === "Feel" || goal.type === "Concern") return `<path d="M ${x} ${y + 36} C ${x - 88} ${y - 15}, ${x - 44} ${y - 58}, ${x} ${y - 25} C ${x + 44} ${y - 58}, ${x + 88} ${y - 15}, ${x} ${y + 36} Z" fill="${goal.type === "Concern" ? "#929292" : "#fff"}" stroke="#18212c" stroke-width="2"/>${text}`;
    return `<circle cx="${x}" cy="${y - 24}" r="12" fill="#fff" stroke="#18212c" stroke-width="2"/><path d="M ${x - 14} ${y - 8} H ${x + 14} V ${y + 25} H ${x + 7} V ${y + 40} H ${x - 7} V ${y + 25} H ${x - 14} Z" fill="#fff" stroke="#18212c" stroke-width="2"/><text x="${x}" y="${y + 63}" font-size="16" text-anchor="middle">${label}</text>`;
};

const nodeForFeedback = (feedback: Feedback, positioned: PositionedGoal[]) => {
    const byId = positioned.find(({goal}) => feedback.nodeId.endsWith(goal.instanceId));
    return byId ?? positioned.find(({goal}) => feedback.nodeLabel === goal.content);
};

export const renderProjectImageSvg = (model: JSONData, includeGoalFeedback = false, includeOverallFeedback = true): string => {
    const {graphWidth, graphHeight, positions, edges} = layoutGraph(model.treeData);
    const feedbacks = includeGoalFeedback ? (model.feedbacks ?? []).slice(0, MAX_EXPORTED_GOAL_FEEDBACK) : [];
    const overall = includeOverallFeedback && model.overallFeedback?.content.trim() ? model.overallFeedback : undefined;
    const hasPanel = Boolean(overall || feedbacks.length);
    const panelWidth = hasPanel ? 380 : 0;
    const panelX = graphWidth + 24;
    const overallLines = overall ? lines(overall.content, 43, 6) : [];
    const overallHeight = overall ? 90 + overallLines.length * 22 : 0;
    const feedbackRows = feedbacks.map((feedback) => ({feedback, body: lines(feedback.content, 43, 4)}));
    const panelHeight = 125 + overallHeight + feedbackRows.reduce((sum, row) => sum + 85 + row.body.length * 22, 0);
    const height = Math.max(graphHeight, hasPanel ? panelHeight : 0);
    const width = graphWidth + (hasPanel ? panelWidth + 24 : 0);
    const badges = feedbacks.map((feedback, index) => {
        const node = nodeForFeedback(feedback, positions);
        return node ? `<g><circle cx="${node.x + 59}" cy="${node.y - 40}" r="14" fill="#6847c9" stroke="#fff" stroke-width="3"/><text x="${node.x + 59}" y="${node.y - 35}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${index + 1}</text></g>` : "";
    }).join("");
    let cursor = 118;
    const overallMarkup = overall ? (() => {
        const y = cursor;
        cursor += overallHeight;
        return `<text x="${panelX + 26}" y="${y}" font-size="15" font-weight="700" fill="#263b66">Overall feedback</text>
            <rect x="${panelX + 20}" y="${y + 15}" width="336" height="${overallHeight - 26}" rx="10" fill="#fff" stroke="#d8e0ea"/>
            <text x="${panelX + 34}" y="${y + 40}" font-size="14" font-weight="700" fill="#202833">${xml(short(overall.author, 36))}</text>
            ${textLines(overallLines, panelX + 34, y + 65, 14, 22)}`;
    })() : "";
    const feedbackMarkup = feedbackRows.map(({feedback, body}, index) => {
        const y = cursor;
        const rowHeight = 75 + body.length * 22;
        cursor += rowHeight + 12;
        return `<rect x="${panelX + 20}" y="${y}" width="336" height="${rowHeight}" rx="10" fill="#fff" stroke="#d8e0ea"/>
            <circle cx="${panelX + 39}" cy="${y + 25}" r="13" fill="#6847c9"/>
            <text x="${panelX + 39}" y="${y + 30}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${index + 1}</text>
            <text x="${panelX + 61}" y="${y + 29}" font-size="14" font-weight="700" fill="#202833">${xml(short(feedback.nodeLabel || feedback.nodeId, 30))}</text>
            <text x="${panelX + 34}" y="${y + 52}" font-size="12" fill="#5f6874">${xml(short(feedback.author, 28))} · ${feedback.status === "resolved" ? "Resolved" : "Open"}</text>
            ${textLines(body, panelX + 34, y + 76, 13, 22)}`;
    }).join("");
    const panel = hasPanel ? `<rect x="${panelX}" y="0" width="${panelWidth}" height="${height}" fill="#f8f9fc"/>
        <text x="${panelX + 20}" y="54" font-size="13" letter-spacing="2" font-weight="700" fill="#5d6878">REVIEW</text>
        <text x="${panelX + 20}" y="82" font-size="24" font-weight="700" fill="#202833">Goal feedback</text>
        ${overallMarkup}${feedbackMarkup}
        ${(model.feedbacks?.length ?? 0) > feedbacks.length && includeGoalFeedback ? `<text x="${panelX + 26}" y="${cursor + 16}" font-size="12" fill="#5f6874">+${(model.feedbacks?.length ?? 0) - feedbacks.length} more comments in the model</text>` : ""}` : "";
    const graph = positions.length ? `${edges.join("")}${positions.map(goalShape).join("")}${badges}`
        : `<text x="${graphWidth / 2}" y="${graphHeight / 2}" text-anchor="middle" font-size="22" fill="#8090a5">Empty model</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="#fff"/><g font-family="Arial, sans-serif">${graph}${panel}</g></svg>`;
};

export const downloadProjectImage = async (model: JSONData, format: "png" | "svg", includeGoalFeedback: boolean, name: string) => {
    const svg = renderProjectImageSvg(model, includeGoalFeedback);
    let blob: Blob;
    if (format === "svg") blob = new Blob([embedJsonInSvg(svg, model)], {type: "image/svg+xml"});
    else {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await image.decode();
        const match = svg.match(/width="(\d+)" height="(\d+)"/);
        const canvas = document.createElement("canvas");
        canvas.width = Number(match?.[1] ?? 720) * 2;
        canvas.height = Number(match?.[2] ?? 510) * 2;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        context.scale(2, 2);
        context.drawImage(image, 0, 0);
        const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) =>
            value ? resolve(value) : reject(new Error("PNG export failed.")), "image/png"));
        blob = await embedJsonInPng(png, model);
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[\\/:*?"<>|]/g, "_") || "Model"}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
