import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {Cell, CellEditorHandler, CellState} from "@maxgraph/core";
import {GoalGraph} from "./GoalGraph";
import {GoalCellEditorHandler} from "./GoalCellEditorHandler";
import {convertEditingValueToList, convertListToEditingValue} from "./GraphLabelUtils";

describe("goal label extensions", () => {
    let graph: GoalGraph;
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        graph = new GoalGraph(container, undefined, [GoalCellEditorHandler]);
    });

    afterEach(() => {
        graph.destroy();
        container.remove();
    });

    it("registers the editor under the standard plugin ID", () => {
        expect(graph.getPlugin(CellEditorHandler.pluginId)).toBeInstanceOf(GoalCellEditorHandler);
    });

    it.each(["cloudShape", "heartShape", "negativeShape"])("formats %s as a list without losing punctuation", shape => {
        const items = ['Careful, "responsible"', "Second & third"];
        const cell = new Cell(convertListToEditingValue(items), undefined, {shape});
        container.innerHTML = graph.getLabel(cell)!;
        expect(Array.from(container.querySelectorAll("li"), item => item.textContent)).toEqual(items);
        expect(graph.isHtmlLabel(cell)).toBe(true);
        graph.labelsVisible = false;
        expect(graph.getLabel(cell)).toBe("");
    });

    it("retains plain functional and stakeholder labels and the default HTML option", () => {
        const cell = new Cell("Plan, build & test");
        expect(graph.getLabel(cell)).toBe("Plan, build & test");
        expect(graph.isHtmlLabel(cell)).toBe(false);
        graph.setHtmlLabels(true);
        expect(graph.isHtmlLabel(cell)).toBe(true);

        const who = new Cell(convertListToEditingValue(['Team, A', 'Team B']));
        who.setId("Nonfunctional-[2:1,3:1]");
        expect(graph.getLabel(who)).toBe("Team, A,\nTeam B");
    });

    it("round-trips edited list punctuation and falls back when a paste replaces the list", () => {
        const cell = new Cell(convertListToEditingValue(["Old", "Second"]), undefined, {shape: "cloudShape"});
        const state = new CellState(graph.getView(), cell, cell.getStyle());
        const editor = graph.getPlugin<GoalCellEditorHandler>(CellEditorHandler.pluginId);
        editor.init();
        editor.textarea!.innerHTML = editor.getInitialValue(state, null);
        editor.textarea!.querySelector("li")!.textContent = 'Careful, "responsible"';
        expect(convertEditingValueToList(editor.getCurrentValue(state)!)).toEqual(['Careful, "responsible"', "Second"]);
        editor.textarea!.textContent = "First, Second";
        expect(editor.getCurrentValue(state)).toBe("First, Second");
    });

    it("uses the default editor conversion for ordinary text", () => {
        const cell = new Cell("Plan & test");
        const state = new CellState(graph.getView(), cell, cell.getStyle());
        const editor = graph.getPlugin<GoalCellEditorHandler>(CellEditorHandler.pluginId);
        editor.init();
        editor.textarea!.innerHTML = editor.getInitialValue(state, null);
        expect(editor.textarea!.textContent).toBe("Plan & test");
        editor.textarea!.textContent = "Updated, plain text";
        expect(editor.getCurrentValue(state)).toBe("Updated, plain text");
    });
});
