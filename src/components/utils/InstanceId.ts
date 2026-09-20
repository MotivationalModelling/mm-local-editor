import {createInstanceId, INSTANCE_ID_SEPARATOR} from "../types";
import type {InstanceId} from "../types";

// Keep legacy compatibility at the import boundary; application IDs use ':'.
const INSTANCE_ID_RE = new RegExp(`^(-?\\d+)${INSTANCE_ID_SEPARATOR}(\\d+)$`);
const LEGACY_INSTANCE_ID_RE = /^(-?\d+)-(\d+)$/;

export const validateInstanceId = (id: string): InstanceId => {
    if (!INSTANCE_ID_RE.test(id)) {
        throw new Error(`badly formatted instanceId "${id}"`);
    }
    return id as InstanceId;
};

export const parseInstanceId = (instanceId: InstanceId) => {
    const match = INSTANCE_ID_RE.exec(instanceId);
    if (!match) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }
    return {goalId: Number(match[1]), refId: Number(match[2])};
};

export const normalizeInstanceId = (instanceId: string): InstanceId => {
    const match = INSTANCE_ID_RE.exec(instanceId) ?? LEGACY_INSTANCE_ID_RE.exec(instanceId);
    if (!match) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }
    return createInstanceId(Number(match[1]), Number(match[2]));
};
