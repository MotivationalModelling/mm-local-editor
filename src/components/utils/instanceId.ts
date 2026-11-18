/**
 * Instance IDs identify one *placement* of a goal in the tree: the goal's own ID paired
 * with a per-goal sequence number, e.g. "12:1". The same goal appearing twice gets
 * "12:1" and "12:2".
 *
 * This module is the single home for that format: the patterns, the readers, and the
 * schema guarding the import boundary. Splitting them up is what let modelJson.ts keep
 * a stale copy of the rules and start rejecting the app's own exports.
 */
import {z} from "zod";

export const INSTANCE_ID_SEPARATOR = ":";

// Models saved before the separator changed spelled instance IDs with a hyphen.
// We still read those, but never write them.
const LEGACY_INSTANCE_ID_SEPARATOR = "-";

// Use `typeof` to derive the separator type from the constant and keep them in sync.
export type InstanceId = `${number}${typeof INSTANCE_ID_SEPARATOR}${number}`;

export interface InstanceIdParts {
    goalId: number;
    refId: number;
}

// The two formats differ only in their separator, so the shape is written once here
const instanceIdPattern = (separator: string) => new RegExp(`^(-?\\d+)${separator}(\\d+)$`);

const INSTANCE_ID_FORMATS = {
    current: instanceIdPattern(INSTANCE_ID_SEPARATOR),
    legacy: instanceIdPattern(LEGACY_INSTANCE_ID_SEPARATOR),
} as const;

/**
 * Reads an instance ID into its parts, or returns null when the value is not one.
 *
 * Whether the legacy spelling counts is the only thing that ever varies, so it is the
 * only option: pass `acceptLegacy` when the ID comes from outside the app (an imported
 * file, localStorage) and may predate the separator change.
 */
export const readInstanceId = (
    value: unknown,
    {acceptLegacy = false} = {},
): InstanceIdParts | null => {
    if (typeof value !== "string") {
        return null;
    }

    const match = INSTANCE_ID_FORMATS.current.exec(value)
        ?? (acceptLegacy ? INSTANCE_ID_FORMATS.legacy.exec(value) : null);

    return (match === null) ? null : {goalId: Number(match[1]), refId: Number(match[2])};
};

export const createInstanceId = ({goalId, refId}: InstanceIdParts): InstanceId => {
    // Instance IDs are made only from integers, so neither component can contain the separator.
    if (!Number.isInteger(goalId)) {
        throw new Error(`non-numeric goalId: "${goalId}"`);
    }
    if (!Number.isInteger(refId)) {
        throw new Error(`non-numeric refId: "${refId}"`);
    }
    if (refId < 0) {
        throw new Error(`negative refId: "${refId}"`);
    }
    return `${goalId}${INSTANCE_ID_SEPARATOR}${refId}`;
};

// Splits an ID that is already in the current format
export const parseInstanceId = (instanceId: InstanceId): InstanceIdParts => {
    const parts = readInstanceId(instanceId);
    if (parts === null) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }
    return parts;
};

/**
 * Rewrites any accepted spelling into the canonical one, and throws if there isn't one.
 *
 * This is the only way a string becomes an InstanceId, so no spelling that createInstanceId
 * would not have produced - a legacy separator, a leading zero - can reach state and fail a
 * string comparison against an ID made there.
 */
export const normalizeInstanceId = (instanceId: string): InstanceId => {
    const parts = readInstanceId(instanceId, {acceptLegacy: true});
    if (parts === null) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }
    return createInstanceId(parts);
};

// Both schemas parse rather than merely check, so the InstanceId they claim to produce
// is one. They differ only in whether a legacy spelling is still let in, mirroring the
// option on readInstanceId.
const instanceIdSchema = (acceptLegacy: boolean) => z.custom<string>(
    (value) => readInstanceId(value, {acceptLegacy}) !== null,
    `instanceId must be two numbers separated by "${INSTANCE_ID_SEPARATOR}", e.g. "12${INSTANCE_ID_SEPARATOR}1"`
).transform(normalizeInstanceId);

// For data already inside the app, where a legacy ID would be a bug
export const InstanceIdSchema = instanceIdSchema(false);

// For the import boundary, where a legacy file still has to open
export const ImportedInstanceIdSchema = instanceIdSchema(true);
