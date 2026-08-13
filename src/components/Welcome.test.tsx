/**
* @jest-environment jsdom
*/
import {cleanup, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import Welcome from "./Welcome";
import FileProvider from "./context/FileProvider";
import ProjectProvider from "./context/ProjectProvider";

const renderWelcome = () => {
    render(
        <MemoryRouter>
            <ProjectProvider>
                <FileProvider>
                    <Welcome/>
                </FileProvider>
            </ProjectProvider>
        </MemoryRouter>
    );
};

describe("Welcome", () => {
    afterEach(cleanup);

    beforeEach(() => {
        localStorage.clear();
    });

    it("shows the hero with logo and actions", () => {
        renderWelcome();
        expect(screen.getByAltText("AMMBER logo")).toBeTruthy();
        expect(screen.getByRole("heading", {name: "Make motivation clear."})).toBeTruthy();
        expect(screen.getByRole("button", {name: "Import project"})).toBeTruthy();
    });

    it("links Get started to the recent projects page", () => {
        renderWelcome();
        const link = screen.getByRole("link", {name: /Get started/});
        expect(link.getAttribute("href")).toBe("/projects");
    });
});
