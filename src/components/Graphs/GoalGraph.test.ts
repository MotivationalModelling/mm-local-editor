import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {Cell, CellEditorHandler, CellState, InternalMouseEvent} from "@maxgraph/core";
import {GoalGraph} from "./GoalGraph";
import {GoalCellEditorHandler} from "./GoalCellEditorHandler";
import {convertEditingValueToList, convertListToEditingValue} from "./GraphLabelUtils";
import {renderFunction} from "./GraphHelpers";
import {prepareGraphForSvg} from "../header/SvgExportUtils";

const renderLinkedGoal = (graph: GoalGraph, id: number) => {
    const root: {value: Cell | null} = {value: null};
    renderFunction({
        GoalID: id, instanceId: `${id}:1`, GoalContent: `Goal ${id}`, GoalType: "Functional",
        GoalNote: "", SubGoals: [], url: `https://example.com/goal-${id}`,
    }, graph, null, root, {}, {}, {}, {}, undefined);
    return root.value!;
};

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

    it("uses the link cursor only over linked text and delegates other cursor behaviour", () => {
        const cell = renderLinkedGoal(graph, 1);
        const state = graph.getView().getState(cell)!;
        const label = state.text!.node;
        const labelEvent = new MouseEvent("mousemove");
        label.dispatchEvent(labelEvent);
        expect(graph.getCursorForMouseEvent(new InternalMouseEvent(labelEvent, state))).toBe("pointer");

        const shapeEvent = new MouseEvent("mousemove");
        state.shape!.node.dispatchEvent(shapeEvent);
        expect(graph.getCursorForMouseEvent(new InternalMouseEvent(shapeEvent, state)))
            .toBe(graph.getCursorForCell(cell));
        expect(graph.getCursorForMouseEvent(new InternalMouseEvent(new MouseEvent("mousemove")))).toBeNull();
    });

    it("exports each linked label with its own model URL without changing the live graph", () => {
        renderLinkedGoal(graph, 1);
        renderLinkedGoal(graph, 2);
        const svg = container.querySelector("svg")!;
        const original = svg.outerHTML;
        const {clone} = prepareGraphForSvg(graph, svg);
        const links = Array.from(clone.querySelectorAll("a"));
        expect(links.map(link => link.getAttribute("href")))
            .toEqual(["https://example.com/goal-1", "https://example.com/goal-2"]);
        links.forEach((link, index) => {
            expect(link.textContent).toContain(`Goal${index + 1}`);
            expect(link.getAttribute("target")).toBe("_blank");
            expect(link.getAttribute("rel")).toBe("noopener noreferrer");
        });
        expect(svg.outerHTML).toBe(original);
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
