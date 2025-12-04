import {describe, expect, it} from "vitest";
import {parseFuncGoalRefId, parseGoalRefId, parseNonFuncGoalRefId} from "./GraphUtils.tsx";

describe('parseGoalRefId', () => {
    it('should raise an exception for an empty refId', () => {
        const refId = '';
        expect(() => parseGoalRefId(refId)).toThrow('cell id is missing');
    });
    it('should raise an exception for invalid type', () => {
        const refId = 'operational-1-2';
        expect(() => parseGoalRefId(refId)).toThrow('unrecognised goal type "operational"');
    });
    it('should raise an exception for invalid format', () => {
        const refId = 'operational;1;2';
        expect(() => parseGoalRefId(refId)).toThrow('malformed cell id "operational;1;2"');
    });
    it('should parse a valid functional id', () => {
        const refId = 'Functional-2-1';
        expect(parseGoalRefId(refId)).toEqual([{goalId: 2, instanceId: "2-1"}]);
    });
    it('should parse a valid non-functional id', () => {
        const refId = 'Nonfunctional-[2-1,1762225479581-1]';
        expect(parseGoalRefId(refId)).toEqual([{goalId: 2, instanceId: "2-1"}, {goalId: 1762225479581, instanceId: "1762225479581-1"}]);
    });
});

describe('parseFuncGoalRefId', () => {
    it('should raise an exception for an empty id', () => {
        const id = '';
        expect(() => parseFuncGoalRefId(id)).toThrow('invalid id: got ""');
    });
    it('should raise an exception for an empty id', () => {
        const refId = '';
        expect(() => parseFuncGoalRefId(refId)).toThrow('invalid id: got ""');
    });
    it('should raise an exception for a bad id', () => {
        const refId = '-';
        expect(() => parseFuncGoalRefId(refId)).toThrow('invalid id: got "-"');
    });
    it('should raise an exception for a malformed id', () => {
        const refId = '-2';
        expect(() => parseFuncGoalRefId(refId)).toThrow('invalid id: got "-2"');
    });
    it('should parse a well-formed id', () => {
        const refId = '1-2';
        expect(parseFuncGoalRefId(refId)).toEqual({goalId: 1, instanceId: "1-2"});
    });
});

describe('parseNonFuncGoalRefId', () => {
    it('should raise an exception for an empty id', () => {
        const refId = '';
        expect(() => parseNonFuncGoalRefId(refId)).toThrow('invalid Nonfunctional id: got "".');
    });
    it('should raise an exception for a bad id', () => {
        const refId = '-';
        expect(() => parseNonFuncGoalRefId(refId)).toThrow('invalid Nonfunctional id: got "-".');
    });
    it('should raise an exception for a malformed id', () => {
        const refId = '-2';
        expect(() => parseNonFuncGoalRefId(refId)).toThrow('invalid Nonfunctional id: got "-2".');
    });
    it('should handle a single pair', () => {
        const refId = '[1-2]';
        expect(parseNonFuncGoalRefId(refId)).toEqual([{goalId: 1, instanceId: "1-2"}]);
    });
    it('should handle multiple pairs', () => {
        const refId = '[1-2,3-4]';
        expect(parseNonFuncGoalRefId(refId)).toEqual([{goalId: 1, instanceId: "1-2"}, {goalId: 3, instanceId: "3-4"}]);
    });
});
