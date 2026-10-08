import {deflate, inflate} from "pako";
import {z} from "zod";

import {parseModelJson, type JSONData} from "../modelJson";
import type {TreeGoal} from "../types";

const SHARE_PREFIX = "#share=";
export const MAX_QR_URL_BYTES = 2800;

const SharePayloadSchema = z.object({
    version: z.literal(2),
    treeData: z.unknown(),
    tabData: z.array(z.object({
        label: z.enum(["Do", "Be", "Feel", "Concern", "Who"]),
        icon: z.string(),
        rows: z.array(z.number().int()),
    })),
    feedbacks: z.unknown().optional(),
    overallFeedback: z.unknown().optional(),
});

const bytesToBase64Url = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64UrlToBytes = (value: string): Uint8Array => {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

// The source repository's v2 share format uses hyphenated instance IDs.
// Convert only the wire snapshot; the editor keeps its current ID format.
const toShareTree = (tree: TreeGoal[]): TreeGoal[] => tree.map((goal) => ({
    ...goal,
    instanceId: goal.instanceId.replace(":", "-") as TreeGoal["instanceId"],
    children: toShareTree(goal.children ?? []),
}));

export const encodeSharedModel = ({tabData, treeData, feedbacks, overallFeedback}: JSONData): string => {
    const model = {tabData, treeData, feedbacks, overallFeedback};
    const modelText = JSON.stringify(model);
    let hash = 2166136261;
    for (let i = 0; i < modelText.length; i++) {
        hash = Math.imul(hash ^ modelText.charCodeAt(i), 16777619);
    }

    const payload = {
        version: 2,
        shareId: `model:${(hash >>> 0).toString(16)}`,
        name: "AMMBER Model",
        treeData: toShareTree(treeData),
        tabData: tabData.map((tab) => ({label: tab.label, icon: tab.icon, rows: tab.goalIds})),
        feedbacks,
        overallFeedback,
    };
    return bytesToBase64Url(deflate(new TextEncoder().encode(JSON.stringify(payload)), {
        raw: true,
        level: 9,
    }));
};

export const createShareUrl = (model: JSONData, origin = window.location.origin): string => {
    const url = new URL("/mm-local-editor/", origin);
    url.hash = `share=${encodeSharedModel(model)}`;
    return url.toString();
};

export const decodeSharedModelHash = (hash: string): JSONData | null => {
    if (!hash.startsWith(SHARE_PREFIX)) return null;

    const encoded = hash.slice(SHARE_PREFIX.length);
    if (!encoded || encoded.length > MAX_QR_URL_BYTES) {
        throw new Error("The shared model link is invalid or too large.");
    }

    try {
        const text = new TextDecoder().decode(inflate(base64UrlToBytes(encoded), {raw: true}));
        const payload = SharePayloadSchema.parse(JSON.parse(text));
        return parseModelJson(JSON.stringify({
            tabData: payload.tabData.map(({label, icon, rows}) => ({
                label,
                icon,
                goalIds: rows,
            })),
            treeData: payload.treeData,
            feedbacks: payload.feedbacks,
            overallFeedback: payload.overallFeedback,
        }));
    } catch {
        throw new Error("The shared model link could not be decoded.");
    }
};

export const getShareUrlByteLength = (url: string): number => new TextEncoder().encode(url).length;
