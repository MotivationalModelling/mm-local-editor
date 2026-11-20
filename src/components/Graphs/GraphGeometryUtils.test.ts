import {describe, expect, it, vi} from "vitest";
import type {Cell, Graph} from "@maxgraph/core";
import {applyGoalLayout, captureGoalLayouts, captureGoalGeometry, hasSameGoalHierarchy, registerNonFunctionalGroup, restoreGoalGeometry} from "./GraphGeometryUtils";
import type {TreeGoal} from "../utils/types";
import {createInstanceId} from "../utils/instanceId";

describe("goal hierarchy comparison", () => {
    const goal = (id: number, children: TreeGoal[] = []): TreeGoal => ({
        id, instanceId: createInstanceId({goalId: id, refId: 1}), type: "Do", content: `Goal ${id}`, children,
    });
    const original = [goal(1, [goal(2), goal(3)])];

    it("ignores moves, text and colour changes, including nested goals", () => {
        expect(hasSameGoalHierarchy(original, original)).toBe(true);
        expect(hasSameGoalHierarchy(original, [{
            ...original[0], x: 100, y: 200, content: "Edited root", color: "red",
            children: [{...goal(2), x: 300, y: 400, content: "Edited child", children: undefined}, goal(3)],
        }])).toBe(true);
        expect(hasSameGoalHierarchy([], [])).toBe(true);
    });

    it.each([
        ["adding", [goal(1, [goal(2), goal(3), goal(4)])]],
        ["deleting", [goal(1, [goal(2)])]],
        ["reordering", [goal(1, [goal(3), goal(2)])]],
        ["reparenting", [goal(1, [goal(2, [goal(3)])])]],
        ["replacing an instance", [goal(1, [{...goal(2), instanceId: createInstanceId({goalId: 2, refId: 2})}, goal(3)])]],
        ["changing type", [goal(1, [{...goal(2), type: "Be"}, goal(3)])]],
    ] satisfies [string, TreeGoal[]][])("detects %s even with unchanged text", (_, current) => {
        expect(hasSameGoalHierarchy(original, current)).toBe(false);
    });
});

describe("non-functional geometry preservation", () => {
    const createCell = (
        id: string | null,
        value: string,
        shape: string,
        x: number,
        y: number,
        width: number,
        height: number
    ) => {
        let geometry = {
            x,
            y,
            width,
            height,
            clone() {
                return {...this, clone: this.clone};
            },
        };

        return {
            getId: () => id,
            getValue: () => value,
            getStyle: () => ({shape}),
            getGeometry: () => geometry,
            setGeometry: (nextGeometry: typeof geometry) => {
                geometry = nextGeometry;
            },
        };
    };

    const createGraph = (getCells: () => ReturnType<typeof createCell>[]) => {
        const setGeometry = vi.fn((cell, geometry) => cell.setGeometry(geometry));
        const graph = {
            getDefaultParent: () => null,
            getChildVertices: () => getCells(),
            getDataModel: () => ({setGeometry}),
        } as unknown as Graph;

        return {graph, setGeometry};
    };

    it("round-trips saved geometry without storing label text or changing functional cells", () => {
        const cloud = createCell("Nonfunctional-[2:1]", "Original", "cloudShape", -10, 20, 240, 160);
        const root = createCell("Functional-1:1", "Root", "rect", 50, 60, 90, 100);
        const {graph} = createGraph(() => [root, cloud]);
        const readCells = vi.spyOn(graph, "getChildVertices");
        const {nonFunctionalLayout: layout, functionalLayout} = captureGoalLayouts(graph);
        expect(readCells).toHaveBeenCalledOnce();
        expect(functionalLayout).toEqual({"Functional-1:1": {x: 50, y: 60, width: 90, height: 100}});
        expect(layout).toEqual({"Nonfunctional-[2:1]": {x: -10, y: 20, width: 240, height: 160}});
        cloud.setGeometry({...cloud.getGeometry(), width: 40, height: 300});
        applyGoalLayout(graph, JSON.parse(JSON.stringify(layout)));
        expect(cloud.getGeometry()).toMatchObject({x: -10, y: 20, width: 240, height: 160});
        expect(root.getGeometry()).toMatchObject({x: 50, y: 60, width: 90, height: 100});
    });

    it.each([
        [false, false, false, false], [true, false, false, true],
        [false, true, false, true], [true, true, false, true],
        [false, false, true, true], [true, false, true, true],
        [false, true, true, true], [true, true, true, true],
    ])("position policy: hierarchy unchanged=%s, saved layout=%s, label changed=%s, preserve=%s", (hierarchyUnchanged, hasSavedLayout, changedLabel, preserve) => {
        let cell = createCell("Nonfunctional-[2:1]", "Original", "cloudShape", 10, 20, 240, 180);
        const {graph} = createGraph(() => [cell]);
        const snapshots = captureGoalGeometry(graph);
        cell = createCell("Nonfunctional-[2:1]", changedLabel ? "Edited" : "Original", "cloudShape", 50, 60, 100, 100);
        const changed = restoreGoalGeometry(graph, snapshots, new Set(), {hierarchyUnchanged, hasSavedLayout});
        expect(cell.getGeometry()).toMatchObject({
            x: preserve ? 10 : 50, y: preserve ? 20 : 60, width: 240, height: 180,
        });
        expect(changed).toEqual(changedLabel ? [cell] : []);
    });

    it("ignores obsolete layout IDs without resizing unrelated nodes", () => {
        const cloud = createCell("Nonfunctional-[2:1]", "New group", "cloudShape", 0, 0, 200, 100);
        const {graph, setGeometry} = createGraph(() => [cloud]);
        applyGoalLayout(graph, {"Nonfunctional-[3:1]": {x: 9, y: 9, width: 9, height: 9}});
        expect(setGeometry).not.toHaveBeenCalled();
    });

    it("saves Do sizes separately and preserves them when the hierarchy repositions a goal", () => {
        const root = createCell("Functional-1:1", "Root", "parallelogramShape", 10, 20, 240, 160);
        root.getStyle = () => ({shape: "parallelogramShape", fontSize: 24});
        const {graph} = createGraph(() => [root]);
        graph.setCellStyles = vi.fn();
        const snapshot = captureGoalGeometry(graph);
        const {functionalLayout: saved, nonFunctionalLayout} = captureGoalLayouts(graph);
        expect(saved).toEqual({"Functional-1:1": {x: 10, y: 20, width: 240, height: 160, fontSize: 24}});
        expect(nonFunctionalLayout).toEqual({});
        root.setGeometry({...root.getGeometry(), x: 100, y: 200, width: 100, height: 80});
        restoreGoalGeometry(graph, snapshot, new Set());
        expect(root.getGeometry()).toMatchObject({x: 100, y: 200, width: 240, height: 160});
        expect(graph.setCellStyles).toHaveBeenCalledWith("fontSize", 24, [root]);
        applyGoalLayout(graph, saved);
        expect(root.getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 160});
    });

    it.each(["file", "snapshot"])("restores geometry and font size from a %s without copying label metadata", source => {
        const cloud = createCell("Nonfunctional-[2:1]", "Label", "cloudShape", 10, 20, 240, 160);
        const style = {shape: "cloudShape", fontSize: 40};
        cloud.getStyle = () => style;
        const {graph} = createGraph(() => [cloud]);
        const setCellStyles = vi.fn();
        graph.setCellStyles = setCellStyles;
        const {nonFunctionalLayout: layout} = captureGoalLayouts(graph);
        const snapshots = captureGoalGeometry(graph);
        const originalGeometry = cloud.getGeometry();
        expect(layout["Nonfunctional-[2:1]"].fontSize).toBe(40);
        cloud.setGeometry({...originalGeometry, width: 100, height: 80});
        if (source === "file") {
            applyGoalLayout(graph, layout);
        } else {
            restoreGoalGeometry(graph, snapshots, new Set([cloud.getId()!]));
        }
        expect(setCellStyles).toHaveBeenCalledWith("fontSize", 40, [cloud]);
        expect(cloud.getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 160});
        expect(cloud.getGeometry()).not.toHaveProperty("fontSize");
        expect(cloud.getGeometry()).not.toHaveProperty("value");
        expect(cloud.getValue()).toBe("Label");
        expect(cloud.getGeometry()).not.toBe(originalGeometry);
    });

    it.each(["0", "", null])("handles snapshot lookup for cell ID %s explicitly", id => {
        const cell = createCell(id, "Edited", "rect", 0, 0, 100, 100);
        const {graph, setGeometry} = createGraph(() => [cell]);
        // Supply the snapshot directly to isolate ID lookup from non-functional
        // prefix classification. "0" is a valid lookup key, not a grouped ID.
        const snapshots = new Map([[id ?? "", {
            value: "Original", x: 10, y: 20, width: 240, height: 180,
        }]]);
        restoreGoalGeometry(graph, snapshots, new Set());
        if (id === "0") {
            expect(setGeometry).toHaveBeenCalledOnce();
            expect(cell.getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 180});
        } else {
            expect(setGeometry).not.toHaveBeenCalled();
        }
    });

    it("restores unaffected shapes after a concern text edit", () => {
        let cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 10, 20, 240, 180),
            createCell("Nonfunctional-[2-1]", "Capable", "heartShape", 300, 30, 180, 220),
            createCell("Nonfunctional-[3-1]", "Unmet expectations", "negativeShape", 500, 200, 300, 240),
        ];
        const {graph} = createGraph(() => cells);
        const snapshots = captureGoalGeometry(graph);

        cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 0, 0, 100, 100),
            createCell("Nonfunctional-[2-1]", "Capable", "heartShape", 0, 0, 100, 100),
            createCell("Nonfunctional-[3-1]", "Unmet expectations and", "negativeShape", 0, 0, 100, 100),
        ];

        restoreGoalGeometry(graph, snapshots, new Set(["Nonfunctional-[3-1]"]));

        expect(cells[0].getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 180});
        expect(cells[1].getGeometry()).toMatchObject({x: 300, y: 30, width: 180, height: 220});
        expect(cells[2].getGeometry()).toMatchObject({x: 500, y: 200, width: 300, height: 240});
    });

    it("returns only changed labels for measurement after restoring their original geometry", () => {
        let cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 10, 20, 240, 180),
            createCell("Nonfunctional-[3-1]", "Short concern", "negativeShape", 500, 200, 300, 100),
        ];
        const {graph} = createGraph(() => cells);
        const snapshots = captureGoalGeometry(graph);

        cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 0, 0, 100, 100),
            createCell("Nonfunctional-[3-1]", "A much longer concern", "negativeShape", 0, 0, 100, 100),
        ];

        const changedCells = restoreGoalGeometry(graph, snapshots, new Set());

        expect(cells[0].getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 180});
        expect(cells[1].getGeometry()).toMatchObject({x: 500, y: 200, width: 300, height: 100});
        expect(changedCells).toEqual([cells[1]]);
    });

    it.each(["cloudShape", "heartShape", "negativeShape", "personShape", "crowdShape"])("preserves %s size and font while allowing automatic repositioning", shape => {
        let cells = [
            createCell("Nonfunctional-[1-1]", "Independent", shape, 10, 20, 240, 180),
        ];
        cells[0].getStyle = () => ({shape, fontSize: 29});
        const {graph} = createGraph(() => cells);
        graph.setCellStyles = vi.fn();
        const snapshots = captureGoalGeometry(graph);

        cells = [
            createCell("Nonfunctional-[1-1]", "Independent", shape, 50, 60, 120, 90),
        ];

        expect(restoreGoalGeometry(graph, snapshots, new Set())).toEqual([]);

        expect(cells[0].getGeometry()).toMatchObject({x: 50, y: 60, width: 240, height: 180});
        expect(graph.setCellStyles).toHaveBeenCalledWith("fontSize", 29, [cells[0]]);

        // A text-only redraw elsewhere in the tree preserves this shape even
        // though its own label did not change and needs no new fit measurement.
        expect(restoreGoalGeometry(graph, snapshots, new Set(), {hierarchyUnchanged: true})).toEqual([]);
        expect(cells[0].getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 180});
    });
});

describe("layout identity when group membership changes", () => {
    const createGroupedCell = (id: string, parentId: string, type = "Quality", width = 360, height = 240, fontSize = 24) => {
        const cell = {
            value: "Original text",
            style: {fontSize},
            geometry: {x: 20, y: 30, width, height, clone() {return {...this};}},
            getId: () => id,
            getValue() {return this.value;},
            getStyle() {return this.style;},
            getGeometry() {return this.geometry;},
        };
        registerNonFunctionalGroup(cell as unknown as Cell, {getId: () => parentId} as Cell, type);
        return cell;
    };
    const createGraph = (getCells: () => ReturnType<typeof createGroupedCell>[]) => ({
        getDefaultParent: () => null,
        getChildVertices: getCells,
        getDataModel: () => ({setGeometry: (cell: ReturnType<typeof createGroupedCell>, geometry: ReturnType<typeof createGroupedCell>["geometry"]) => {cell.geometry = geometry;}}),
        setCellStyles: (key: "fontSize", value: number, cells: ReturnType<typeof createGroupedCell>[]) => cells.forEach(cell => {cell.style[key] = value;}),
    } as unknown as Graph);

    it.each([
        ["adding a point", "Nonfunctional-[2:1,3:1,4:1]"],
        ["removing a point", "Nonfunctional-[2:1]"],
        ["reordering identical labels", "Nonfunctional-[3:1,2:1]"],
    ])("restores the same parent's group after %s and schedules fitting", (_, nextId) => {
        let cells = [
            createGroupedCell("Nonfunctional-[2:1,3:1]", "Functional-1:1"),
            createGroupedCell("Nonfunctional-[2:2,3:2]", "Functional-1:2", "Quality", 500, 300, 20),
            createGroupedCell("Nonfunctional-[5:1]", "Functional-1:1", "Emotional", 200, 220, 18),
        ];
        const graph = createGraph(() => cells);
        const snapshots = captureGoalGeometry(graph);
        const {nonFunctionalLayout: saved} = captureGoalLayouts(graph);
        expect(saved["Nonfunctional-[2:1,3:1]"]).not.toHaveProperty("groupKey");

        cells = [
            createGroupedCell(nextId, "Functional-1:1", "Quality", 100, 100, 16),
            createGroupedCell("Nonfunctional-[2:2,3:2]", "Functional-1:2", "Quality", 100, 100, 16),
            createGroupedCell("Nonfunctional-[5:1]", "Functional-1:1", "Emotional", 100, 100, 16),
        ];
        // Text is deliberately unchanged: changed membership still needs
        // restoration, even when points have identical labels.
        expect(restoreGoalGeometry(graph, snapshots, new Set())).toEqual([cells[0]]);
        expect(cells[0].geometry).toMatchObject({x: 20, y: 30, width: 360, height: 240});
        expect(cells[0].style.fontSize).toBe(24);
        expect(cells[1].geometry).toMatchObject({width: 500, height: 300});
        expect(cells[1].style.fontSize).toBe(20);
        expect(cells[2].geometry).toMatchObject({width: 200, height: 220});
        expect(cells[2].style.fontSize).toBe(18);
    });

    it.each([
        ["Functional-1:2", "Quality"],
        ["Functional-1:1", "Emotional"],
    ])("does not transfer layout to a different parent/type (%s, %s)", (parent, type) => {
        let cells = [createGroupedCell("Nonfunctional-[2:1]", "Functional-1:1")];
        const graph = createGraph(() => cells);
        const snapshots = captureGoalGeometry(graph);
        cells = [createGroupedCell("Nonfunctional-[2:1]", parent, type, 100, 150, 16)];
        expect(restoreGoalGeometry(graph, snapshots, new Set(), {hierarchyUnchanged: true})).toEqual([]);
        expect(cells[0].geometry).toMatchObject({width: 100, height: 150});
        expect(cells[0].style.fontSize).toBe(16);
    });
});
