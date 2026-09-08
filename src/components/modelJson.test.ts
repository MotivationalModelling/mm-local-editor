import {describe, expect, it} from "vitest";
import {createModelJson, ModelJsonError, parseModelJson} from "./modelJson";
import type {TabContent, TreeGoal} from "./types";

const tabs: TabContent[] = [
    {label: "Do", icon: "", goalIds: [1]},
    {label: "Be", icon: "", goalIds: [2]},
    {label: "Feel", icon: "", goalIds: []},
    {label: "Concern", icon: "", goalIds: []},
    {label: "Who", icon: "", goalIds: []},
];
const createTree = (): TreeGoal[] => [{
    id: 1, content: "Root", type: "Do", instanceId: "1:1", x: 12, y: 34,
    children: [
        {id: 2, content: "Old text", type: "Be", instanceId: "2:1", color: "red", children: []},
        {id: 2, content: "Old text", type: "Be", instanceId: "2:2", x: 60, children: []},
    ],
}];
const openTree = (treeData: unknown) => parseModelJson(JSON.stringify({tabData: tabs, treeData}));

describe("model JSON round trip", () => {
    it("round-trips optional layout while accepting old files without it", () => {
        const tree = createTree();
        const goals = {1: tree[0], 2: tree[0].children![0]};
        const layout = {"Nonfunctional-[2:1,2:2]": {x: -120, y: 30, width: 250, height: 180}};
        const saved = createModelJson(tabs, tree, goals, layout);
        expect(parseModelJson(JSON.stringify(saved)).nonFunctionalLayout).toEqual(layout);
        expect(openTree(tree).nonFunctionalLayout).toBeUndefined();
    });

    it.each([0, -5, "wide"])("rejects invalid saved width %s", width => {
        expect(() => parseModelJson(JSON.stringify({
            tabData: tabs, treeData: createTree(),
            nonFunctionalLayout: {cloud: {x: 0, y: 0, width, height: 100}},
        }))).toThrow(ModelJsonError);
    });

    it.each([":", "-"])("opens %s IDs and normalizes every level", separator => {
        const input = JSON.stringify({tabData: tabs, treeData: createTree()})
            .replace(/(\d+):(\d+)/g, `$1${separator}$2`);
        expect(parseModelJson(input).treeData).toEqual(createTree());
    });

    it("saves current content for every reference without mutating placement or live state", () => {
        const tree = createTree();
        const before = structuredClone(tree);
        const goals = {
            1: {...tree[0], content: "Updated root"},
            2: {...tree[0].children![0], content: "Able to learn from <practice> & 中文 😀"},
        };
        const saved = createModelJson(tabs, tree, goals);
        const reopened = parseModelJson(JSON.stringify(saved));
        expect(reopened.treeData[0].content).toBe("Updated root");
        expect(reopened.treeData[0].children?.map(node => node.content))
            .toEqual([goals[2].content, goals[2].content]);
        expect(reopened.treeData[0]).toMatchObject({instanceId: "1:1", x: 12, y: 34});
        expect(reopened.treeData[0].children).toMatchObject([
            {instanceId: "2:1", color: "red"}, {instanceId: "2:2", x: 60},
        ]);
        expect(tree).toEqual(before);
    });

    it.each(["bad", "1:", "1:2:3", "1:-2"])("rejects malformed IDs: %s", instanceId => {
        const tree = createTree();
        expect(() => openTree([{...tree[0], instanceId}])).toThrow(ModelJsonError);
    });

    it("rejects duplicate references even when their separators differ", () => {
        const root = createTree()[0];
        const child = root.children![0];
        expect(() => openTree([{...root, children: [child, {...child, instanceId: "2-1"}]}]))
            .toThrow("duplicate instanceId");
    });

    it("still rejects an ID pointing at a different goal", () => {
        expect(() => openTree([{...createTree()[0], instanceId: "9:1"}]))
            .toThrow("does not match goal ID");
    });

    it("fails safely when authoritative goal data is missing", () => {
        expect(() => createModelJson(tabs, createTree(), {})).toThrow("goal 1 is missing");
    });
});
