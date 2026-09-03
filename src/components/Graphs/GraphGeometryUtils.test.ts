import {describe, expect, it, vi} from "vitest";
import type {Graph} from "@maxgraph/core";
import {captureNonFunctionalGeometry, restoreNonFunctionalGeometry} from "./GraphGeometryUtils";

describe("non-functional geometry preservation", () => {
    const createCell = (
        id: string,
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

    const createGraph = (getCells: () => ReturnType<typeof createCell>[], preferredHeight = 40) => {
        const setGeometry = vi.fn((cell, geometry) => cell.setGeometry(geometry));
        const graph = {
            getDefaultParent: () => null,
            getChildVertices: () => getCells(),
            getDataModel: () => ({setGeometry}),
            getPreferredSizeForCell: () => ({x: 0, y: 0, width: 100, height: preferredHeight}),
        } as unknown as Graph;

        return {graph, setGeometry};
    };

    it("restores unaffected shapes after a concern text edit", () => {
        let cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 10, 20, 240, 180),
            createCell("Nonfunctional-[2-1]", "Capable", "heartShape", 300, 30, 180, 220),
            createCell("Nonfunctional-[3-1]", "Unmet expectations", "negativeShape", 500, 200, 300, 240),
        ];
        const {graph} = createGraph(() => cells);
        const snapshots = captureNonFunctionalGeometry(graph);

        cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 0, 0, 100, 100),
            createCell("Nonfunctional-[2-1]", "Capable", "heartShape", 0, 0, 100, 100),
            createCell("Nonfunctional-[3-1]", "Unmet expectations and", "negativeShape", 0, 0, 100, 100),
        ];

        restoreNonFunctionalGeometry(graph, snapshots, new Set(["Nonfunctional-[3-1]"]), 4);

        expect(cells[0].getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 180});
        expect(cells[1].getGeometry()).toMatchObject({x: 300, y: 30, width: 180, height: 220});
        expect(cells[2].getGeometry()).toMatchObject({x: 500, y: 200, width: 300, height: 240});
    });

    it("grows only the edited shape when the preserved label area is too short", () => {
        let cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 10, 20, 240, 180),
            createCell("Nonfunctional-[3-1]", "Short concern", "negativeShape", 500, 200, 300, 100),
        ];
        const {graph} = createGraph(() => cells, 100);
        const snapshots = captureNonFunctionalGeometry(graph);

        cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 0, 0, 100, 100),
            createCell("Nonfunctional-[3-1]", "A much longer concern", "negativeShape", 0, 0, 100, 100),
        ];

        restoreNonFunctionalGeometry(graph, snapshots, new Set(), 4);

        expect(cells[0].getGeometry()).toMatchObject({x: 10, y: 20, width: 240, height: 180});
        expect(cells[1].getGeometry()).toMatchObject({x: 500, y: 200, width: 300});
        expect(cells[1].getGeometry()!.height).toBeCloseTo(200);
    });

    it("does not override geometry for renders unrelated to text edits", () => {
        let cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 10, 20, 240, 180),
        ];
        const {graph, setGeometry} = createGraph(() => cells);
        const snapshots = captureNonFunctionalGeometry(graph);

        cells = [
            createCell("Nonfunctional-[1-1]", "Independent", "cloudShape", 50, 60, 120, 90),
        ];

        restoreNonFunctionalGeometry(graph, snapshots, new Set(), 4);

        expect(setGeometry).not.toHaveBeenCalled();
        expect(cells[0].getGeometry()).toMatchObject({x: 50, y: 60, width: 120, height: 90});
    });
});
