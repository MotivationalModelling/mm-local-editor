import {describe, expect, it} from "vitest";
import {ModelJsonError, parseModelJson} from "./modelJson.ts";
import {InstanceId, TreeGoal} from "./types.ts";
import {createInstanceId, INSTANCE_ID_SEPARATOR} from "./instanceId.ts";

// Every label needs a tab, and each goal must be listed in the tab for its type
const buildModel = (treeData: TreeGoal[]) => ({
    tabData: [
        {label: "Do", icon: "/img/Function.png", goalIds: [1, 6]},
        {label: "Be", icon: "/img/Cloud.png", goalIds: [2]},
        {label: "Feel", icon: "/img/Heart.png", goalIds: [3]},
        {label: "Concern", icon: "/img/Risk.png", goalIds: [4]},
        {label: "Who", icon: "/img/Stakeholder.png", goalIds: [5]},
    ],
    treeData,
});

// instanceId is widened to string so the tests can feed in legacy and malformed
// values that the InstanceId template type would otherwise reject
const goal = (id: number, instanceId: string, children?: TreeGoal[]): TreeGoal => ({
    id,
    content: `Goal ${id}`,
    type: "Do",
    instanceId: instanceId as InstanceId,
    ...(children === undefined ? {} : {children}),
});

const parse = (model: unknown) => parseModelJson(JSON.stringify(model));

describe('parseModelJson instance IDs', () => {
    // The regression: the schema still required the old hyphen separator, so a
    // file this app had just exported was rejected on import
    it('should accept the instance ID format the app exports', () => {
        const instanceId = createInstanceId(1, 1);
        expect(instanceId).toBe(`1${INSTANCE_ID_SEPARATOR}1`);

        const result = parse(buildModel([goal(1, instanceId)]));
        expect(result.treeData[0].instanceId).toBe(instanceId);
    });

    it('should accept nested goals using the exported format', () => {
        const model = buildModel([goal(1, "1:1", [goal(6, "6:1")])]);
        expect(() => parse(model)).not.toThrow();
    });

    // normalizeInstanceId() upgrades these once they are in state, so the schema
    // has to let them through rather than blocking the migration
    it('should still accept legacy hyphenated instance IDs', () => {
        expect(() => parse(buildModel([goal(1, "1-1")]))).not.toThrow();
    });

    it('should accept a negative goal ID in either format', () => {
        const model = (instanceId: string) => ({
            ...buildModel([goal(-5, instanceId)]),
            tabData: [
                {label: "Do", icon: "a", goalIds: [-5]},
                {label: "Be", icon: "b", goalIds: []},
                {label: "Feel", icon: "c", goalIds: []},
                {label: "Concern", icon: "d", goalIds: []},
                {label: "Who", icon: "e", goalIds: []},
            ],
        });

        expect(() => parse(model("-5:1"))).not.toThrow();
        // Splitting on "-" used to read an empty string here and report goal ID 0
        expect(() => parse(model("-5-1"))).not.toThrow();
    });

    it('should reject a malformed instance ID', () => {
        expect(() => parse(buildModel([goal(1, "nonsense")])))
            .toThrow(ModelJsonError);
        expect(() => parse(buildModel([goal(1, "nonsense")])))
            .toThrow(/instanceId must be two numbers separated by ":"/);
    });

    it('should still reject an instance ID that disagrees with its goal ID', () => {
        expect(() => parse(buildModel([goal(1, "6:1")])))
            .toThrow(/does not match goal ID 1/);
    });

    it('should still reject duplicate instance IDs', () => {
        expect(() => parse(buildModel([goal(1, "1:1"), goal(1, "1:1")])))
            .toThrow(/duplicate instanceId/);
    });

    it('should treat the legacy and canonical spelling of one ID as duplicates', () => {
        expect(() => parse(buildModel([goal(1, "1:1"), goal(1, "1-1")])))
            .toThrow(/duplicate instanceId/);
    });
});
