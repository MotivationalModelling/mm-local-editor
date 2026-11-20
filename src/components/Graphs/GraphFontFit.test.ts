// @vitest-environment jsdom
import {describe, expect, it, vi} from "vitest";
import type {Cell, Graph} from "@maxgraph/core";
import {createCellLabelMeasurement, findFittingScale, getGeometryToFitLabel} from "./GraphFontFit";

describe("font growth scale search", () => {
    it("leaves already fitting labels unchanged", () => {
        expect(findFittingScale(() => true, 200)).toBe(1);
    });
    it("finds a fitting upper bound without significant oversizing", () => {
        for (const required of [1.01, 1.5, 2, 3.7, 10]) {
            const scale = findFittingScale(candidate => candidate >= required, 200);
            expect(scale).toBeGreaterThanOrEqual(required);
            expect((scale - required) * 200).toBeLessThanOrEqual(0.5);
        }
    });
});

describe("label measurement lifecycle", () => {
    it("measures the same target area independently of the previous shape size and zoom", () => {
        const source = document.createElement("div");
        source.innerHTML = '<ul style="font-size:16px"><li>Label</li></ul>';
        document.body.appendChild(source);
        const widths: number[] = [];
        const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
            widths.push(parseFloat(this.parentElement!.style.width));
            return {height: 0} as DOMRect;
        });
        try {
            for (const [width, scale] of [[300.6, 1], [223.1, 1.2]]) {
                const cell = {getGeometry: () => ({width, height: 200})} as Cell;
                const graph = {
                    getCellStyle: () => ({shape: "cloudShape"}),
                    getView: () => ({getState: () => ({text: {
                        node: source, bounds: {width: (width * 0.6 - 4) * scale, height: 104 * scale}, scale,
                    }})}),
                    getPlugin: () => undefined,
                } as unknown as Graph;
                const measurement = createCellLabelMeasurement(graph, cell)!;
                try {
                    measurement.fits({width: 200, height: 100}, 8);
                } finally {
                    measurement.dispose();
                }
            }
            expect(widths).toEqual([116, 116]);
        } finally {
            measure.mockRestore();
            source.remove();
        }
    });

    it.each([false, true])("removes the temporary copy without changing the label (measurement throws: %s)", throws => {
        const source = document.createElement("div");
        source.innerHTML = '<ul style="font-size:16px"><li>Original label</li></ul>';
        document.body.appendChild(source);
        const originalMarkup = document.body.innerHTML;
        const cell = {getGeometry: () => ({width: 200, height: 100})} as Cell;
        const graph = {
            getCellStyle: () => ({shape: "cloudShape", fontSize: 16}),
            getView: () => ({getState: () => ({text: {node: source, bounds: {width: 120, height: 54}, scale: 1}})}),
            getPlugin: () => undefined,
        } as unknown as Graph;
        // jsdom cannot measure wrapping. Only exercise cleanup here; actual
        // text fit and geometry are covered by the browser tests.
        const measurementError = new Error("Measurement failed");
        const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
        if (throws) measure.mockImplementation(() => {throw measurementError;});
        try {
            if (throws) {
                expect(() => getGeometryToFitLabel(graph, cell, 20)).toThrow(measurementError);
            } else {
                expect(getGeometryToFitLabel(graph, cell, 20)).toBeNull();
            }
            expect(document.body.innerHTML).toBe(originalMarkup);
        } finally {
            measure.mockRestore();
            source.remove();
        }
    });
});
