/**
 * @vitest-environment jsdom
 */

import React, {useState} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";

import SpellcheckGoalInput from "./SpellcheckGoalInput.tsx";

const TestEditor = () => {
    const [, setEditingId] = useState<number | null>(null);
    const [values, setValues] = useState(["A mispeled goal", "Another goal"]);

    return values.map((value, index) => (
        <SpellcheckGoalInput
            key={index}
            value={value}
            placeholder="Enter goal..."
            aria-label={`Goal ${index + 1}`}
            onBlur={() => setEditingId(null)}
            onChange={(nextValue) => {
                setValues((currentValues) => currentValues.map(
                    (currentValue, valueIndex) => valueIndex === index ? nextValue : currentValue,
                ));
            }}
            onDragStart={() => undefined}
            onFocus={() => setEditingId(index)}
            onKeyDown={() => undefined}
        />
    ));
};

describe("SpellcheckGoalInput", () => {
    it("keeps the same spellchecked editing host when focus moves between goals", () => {
        render(<TestEditor />);

        const firstGoal = screen.getByRole("textbox", {name: "Goal 1"});
        const secondGoal = screen.getByRole("textbox", {name: "Goal 2"});

        expect(firstGoal.getAttribute("spellcheck")).toBe("true");
        expect(firstGoal.getAttribute("contenteditable")).toBe("plaintext-only");

        fireEvent.focus(firstGoal);
        firstGoal.textContent = "A persistant mispelling";
        fireEvent.input(firstGoal);
        fireEvent.blur(firstGoal);
        fireEvent.focus(secondGoal);

        expect(screen.getByRole("textbox", {name: "Goal 1"})).toBe(firstGoal);
        expect(firstGoal.textContent).toBe("A persistant mispelling");
    });

    it("prevents Enter from inserting a line break", () => {
        const onKeyDown = vi.fn();

        render(
            <SpellcheckGoalInput
                value="Goal"
                placeholder="Enter goal..."
                aria-label="Goal"
                onBlur={() => undefined}
                onChange={() => undefined}
                onDragStart={() => undefined}
                onFocus={() => undefined}
                onKeyDown={onKeyDown}
            />,
        );

        const goal = screen.getByRole("textbox", {name: "Goal"});
        const eventAccepted = fireEvent.keyDown(goal, {key: "Enter"});

        expect(eventAccepted).toBe(false);
        expect(onKeyDown).toHaveBeenCalledOnce();
    });
});
