import {describe, expect, it} from "vitest";
import {
    createInstanceId,
    normalizeInstanceId,
    parseInstanceId,
    readInstanceId,
} from "./instanceId.ts";

describe("readInstanceId", () => {
    it("reads the current format", () => {
        expect(readInstanceId("12:3")).toEqual({goalId: 12, refId: 3});
    });

    it("reads a negative goal ID, which the placeholder goals use", () => {
        expect(readInstanceId("-5:1")).toEqual({goalId: -5, refId: 1});
    });

    // Strict by default: an ID already in application state should never be legacy
    it("rejects the legacy format unless legacy is accepted", () => {
        expect(readInstanceId("12-3")).toBeNull();
        expect(readInstanceId("12-3", {acceptLegacy: true})).toEqual({goalId: 12, refId: 3});
    });

    it("reads a negative goal ID in the legacy format without losing the sign", () => {
        // Splitting on "-" used to yield an empty string here, reporting goal ID 0
        expect(readInstanceId("-5-1", {acceptLegacy: true})).toEqual({goalId: -5, refId: 1});
    });

    it("returns null for malformed values, whatever is accepted", () => {
        for (const value of ["", "nonsense", "1", "1:", ":1", "1:2:3", "a:b", " 1:2"]) {
            expect(readInstanceId(value)).toBeNull();
            expect(readInstanceId(value, {acceptLegacy: true})).toBeNull();
        }
    });

    it("returns null for non-strings so callers can pass untrusted input", () => {
        for (const value of [1, null, undefined, {}, ["1:2"]]) {
            expect(readInstanceId(value)).toBeNull();
        }
    });
});

describe('instance IDs', () => {
    it('should create an instance ID with the new separator', () => {
        expect(createInstanceId({goalId: -5, refId: 1})).toBe('-5:1');
    });

    it('should identify invalid goal ID components when creating an instance ID', () => {
        expect(() => createInstanceId({goalId: 1.5, refId: 1})).toThrow('non-numeric goalId: "1.5"');
    });

    it('should identify invalid reference ID components when creating an instance ID', () => {
        expect(() => createInstanceId({goalId: 1, refId: 1.5})).toThrow('non-numeric refId: "1.5"');
    });

    it('should reject a negative reference ID when creating an instance ID', () => {
        expect(() => createInstanceId({goalId: 1, refId: -1})).toThrow('negative refId: "-1"');
    });

    it('should parse the new separator with a negative goal id', () => {
        expect(parseInstanceId('-5:1')).toEqual({goalId: -5, refId: 1});
    });

    it('should normalise a legacy instance ID', () => {
        expect(normalizeInstanceId('-5-1')).toBe('-5:1');
    });

    // State compares instance IDs by string equality, so a spelling createInstanceId
    // would not have produced must not survive the trip in
    it('should normalise a spelling createInstanceId would not have produced', () => {
        expect(normalizeInstanceId('01:1')).toBe('1:1');
    });

    it('should reject a value that is not an instance ID at all', () => {
        expect(() => normalizeInstanceId('nonsense')).toThrow('badly formatted instanceId "nonsense"');
    });
});
