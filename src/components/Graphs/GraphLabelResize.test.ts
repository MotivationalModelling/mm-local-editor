// @vitest-environment jsdom
import {describe, expect, it, vi} from "vitest";
import {Rectangle} from "@maxgraph/core";
import type {Cell, Graph} from "@maxgraph/core";
import {getGoalLabelResizePlan, fitLabelToResize} from "./GraphLabelResize";
import * as measurement from "./GraphFontFit";

// Deterministic capacity for algorithm tests. Real wrapping is exercised in Cypress.
const fits = (bounds: Rectangle, font: number) => bounds.width >= font * 10 && bounds.height >= font * 5;

describe("manual label shrinking", () => {
    it("subtracts four points at capacity before scaling and rounds down", () => {
        const result = fitLabelToResize(new Rectangle(0, 0, 300, 150), new Rectangle(0, 0, 240, 120), 30, fits)!;
        expect(result.fontSize).toBe(20);
        expect(fits(result.bounds, result.fontSize)).toBe(true);
    });

    it("does not treat the input limit as the shape's capacity", () => {
        const result = fitLabelToResize(new Rectangle(0, 0, 500, 300), new Rectangle(0, 0, 400, 240), 40, fits)!;
        expect(result.fontSize).toBe(32);
    });

    it("does not repeatedly subtract four points once there is breathing room", () => {
        const original = new Rectangle(0, 0, 300, 150);
        const first = fitLabelToResize(original, new Rectangle(0, 0, 240, 120), 30, fits)!;
        const second = fitLabelToResize(first.bounds, new Rectangle(0, 0, 192, 96), first.fontSize, fits)!;
        expect(second.fontSize).toBe(16);
    });

    it.each([[0.5, 0.8], [0.8, 0.5], [0.6, 1.2]])("uses the smaller axis ratio (%s, %s)", (width, height) => {
        const result = fitLabelToResize(new Rectangle(0, 0, 300, 200), new Rectangle(0, 0, 300 * width, 200 * height), 24, fits)!;
        expect(result.fontSize).toBe(Math.floor(24 * Math.min(width, height)));
        expect(fits(result.bounds, result.fontSize)).toBe(true);
    });

    it.each([12, 11.9])("finds the largest fitting integer when wrapping limits the font to %s", capacity => {
        const result = fitLabelToResize(new Rectangle(0, 0, 300, 200), new Rectangle(0, 0, 240, 160), 24,
            (bounds, font) => font <= (bounds.width === 300 ? 30 : capacity))!;
        expect(result.fontSize).toBe(Math.floor(capacity));
    });

    it.each(["bottom-right", "top-left"])("limits a %s shrink at font 8 and keeps the opposite corner anchored", corner => {
        const original = new Rectangle(20, 30, 300, 150);
        const requested = corner === "bottom-right" ? new Rectangle(20, 30, 30, 15) : new Rectangle(290, 165, 30, 15);
        const result = fitLabelToResize(original, requested, 24, fits)!;
        expect(result.fontSize).toBe(8);
        expect(result.bounds.width).toBeGreaterThanOrEqual(80);
        expect(result.bounds.width).toBeLessThan(80.5);
        expect(result.bounds.width / result.bounds.height).toBe(2);
        expect(fits(result.bounds, result.fontSize)).toBe(true);
        if (corner === "bottom-right") {
            expect(result.bounds.x).toBe(original.x);
            expect(result.bounds.y).toBe(original.y);
        } else {
            expect(result.bounds.x + result.bounds.width).toBe(original.x + original.width);
            expect(result.bounds.y + result.bounds.height).toBe(original.y + original.height);
        }
    });

    it.each([8, 9, 10, 11])("never applies the four-point reduction below 8 (starting font %s)", font => {
        const original = new Rectangle(0, 0, font * 10, font * 5);
        const result = fitLabelToResize(original, new Rectangle(0, 0, 40, 20), font, fits)!;
        expect(result.fontSize).toBe(8);
        expect(fits(result.bounds, 8)).toBe(true);
    });

    it("does not make a previously clipped imported shape smaller", () => {
        const original = new Rectangle(0, 0, 50, 25);
        const result = fitLabelToResize(original, new Rectangle(0, 0, 10, 5), 8, fits)!;
        expect(result.bounds).toEqual(original);
        expect(result.fontSize).toBe(8);
    });

    it.each([new Rectangle(0, 0, 400, 200), new Rectangle(30, 40, 300, 150)])("leaves enlargements and moves unchanged", requested => {
        const measure = vi.fn(fits);
        expect(fitLabelToResize(new Rectangle(0, 0, 300, 150), requested, 24, measure)).toBeNull();
        expect(measure).not.toHaveBeenCalled();
    });
});

describe("resize planning", () => {
    it.each(["personShape", "crowdShape"])("scales %s fonts in either direction without internal text measurement", shape => {
        const cell = {getGeometry: () => new Rectangle(0, 0, 100, 200), getStyle: () => ({shape})} as Cell;
        const graph = {getCellStyle: () => ({fontSize: 24})} as unknown as Graph;
        const measure = vi.spyOn(measurement, "createCellLabelMeasurement");
        try {
            for (const [scale, expected] of [[0.8, 19], [1.2, 28], [0.1, 8], [3, 40]]) {
                const bounds = new Rectangle(0, 0, 100 * scale, 200 * scale);
                expect(getGoalLabelResizePlan(graph, cell, bounds)).toEqual({bounds, fontSize: expected});
            }
            expect(measure).not.toHaveBeenCalled();
        } finally {
            measure.mockRestore();
        }
    });

    it.each([false, true])("disposes text measurement without mutating the model (measurement throws: %s)", throws => {
        const cell = {getGeometry: () => new Rectangle(0, 0, 300, 150), getStyle: () => ({shape: "cloudShape"})} as Cell;
        const graph = {getCellStyle: () => ({fontSize: 30})} as unknown as Graph;
        const bounds = new Rectangle(0, 0, 240, 120);
        const dispose = vi.fn();
        const measure = vi.spyOn(measurement, "createCellLabelMeasurement").mockReturnValue({
            fits: throws ? () => {throw new Error("failed measurement");} : fits, dispose,
        });
        try {
            if (throws) {
                expect(() => getGoalLabelResizePlan(graph, cell, bounds)).toThrow("failed measurement");
            } else {
                expect(getGoalLabelResizePlan(graph, cell, bounds)).toEqual({bounds, fontSize: 20});
            }
            expect(dispose).toHaveBeenCalledOnce();
        } finally {
            measure.mockRestore();
        }
    });
});
