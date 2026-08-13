/**
* @jest-environment jsdom
*/
import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vitest";
import ProjectProvider from "./ProjectProvider";
import {useProjectContext} from "./ProjectContext";
import {newProjectData} from "../utils/projects";

const wrapper = ({children}: React.PropsWithChildren) => (
    <ProjectProvider>{children}</ProjectProvider>
);

describe("ProjectProvider", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("creates a project and sets it as current", () => {
        const {result} = renderHook(() => useProjectContext(), {wrapper});
        act(() => {
            result.current.createProject("My Model");
        });
        expect(result.current.projects).toHaveLength(1);
        expect(result.current.currentProject?.name).toBe("My Model");
    });

    it("uses a unique default name for repeated creates", () => {
        const {result} = renderHook(() => useProjectContext(), {wrapper});
        act(() => {
            result.current.createProject();
        });
        act(() => {
            result.current.createProject();
        });
        expect(result.current.projects.map((p) => p.name)).toEqual(["Untitled 1", "Untitled"]);
    });

    it("renames and deletes a project", () => {
        const {result} = renderHook(() => useProjectContext(), {wrapper});
        act(() => {
            result.current.createProject("A");
        });
        const id = result.current.projects[0].id;
        act(() => {
            result.current.renameProject(id, "B");
        });
        expect(result.current.projects[0].name).toBe("B");
        act(() => {
            result.current.deleteProject(id);
        });
        expect(result.current.projects).toHaveLength(0);
    });

    it("clears currentProjectId when the current project is deleted", () => {
        const {result} = renderHook(() => useProjectContext(), {wrapper});
        act(() => {
            result.current.createProject("A");
        });
        const id = result.current.currentProjectId;
        act(() => {
            result.current.deleteProject(id as string);
        });
        expect(result.current.currentProjectId).toBeNull();
    });

    it("saves project data", () => {
        const {result} = renderHook(() => useProjectContext(), {wrapper});
        act(() => {
            result.current.createProject();
        });
        const id = result.current.projects[0].id;
        const data = newProjectData();
        act(() => {
            result.current.saveProjectData(id, data);
        });
        expect(result.current.projects[0].treeData).toEqual(data.treeData);
    });
});
