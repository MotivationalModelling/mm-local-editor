/**
* @jest-environment jsdom
*/
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach, describe, expect, it} from "vitest";
import Papers from "./Papers";

describe("Papers", () => {
    afterEach(cleanup);

    it("previews the selected paper", () => {
        render(<MemoryRouter><Papers/></MemoryRouter>);

        const initialPreview = screen.getByTitle(/Preview of Using Motivational Models/);
        expect(initialPreview.getAttribute("src")).toContain("CHASE_2023_emotions.pdf");

        fireEvent.click(screen.getByRole("button", {name: /Motivational models for validating agile requirements/}));
        const nextPreview = screen.getByTitle(/Preview of Motivational models for validating agile requirements/);
        expect(nextPreview.getAttribute("src")).toContain("CSCE_2021.pdf");
    });
});
