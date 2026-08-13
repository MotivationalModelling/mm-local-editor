import React, {PropsWithChildren, useCallback, useMemo} from "react";
import useLocalStorage from "../utils/useLocalStorage";
import {Project, defaultProjectName, newProjectData, newProjectId} from "../utils/projects";
import {ProjectContext, ProjectData} from "./ProjectContext";

export const ProjectProvider: React.FC<PropsWithChildren> = ({children}) => {
    const [projects, setProjects] = useLocalStorage<Project[]>("ammber/projects", []);
    const [currentProjectId, setCurrentProjectId] = useLocalStorage<string | null>(
        "ammber/currentProjectId",
        null
    );

    const createProject = useCallback((name?: string, data?: ProjectData): Project => {
        const defaults = newProjectData();
        const project: Project = {
            id: newProjectId(),
            name: name ?? defaultProjectName(projects.map((p) => p.name)),
            treeData: data?.treeData ?? defaults.treeData,
            tabData: data?.tabData ?? defaults.tabData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setProjects((prev) => [project, ...prev]);
        setCurrentProjectId(project.id);
        return project;
    }, [projects, setProjects, setCurrentProjectId]);

    const openProject = useCallback((id: string) => {
        setCurrentProjectId(id);
    }, [setCurrentProjectId]);

    const renameProject = useCallback((id: string, name: string) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? {...p, name} : p)));
    }, [setProjects]);

    const deleteProject = useCallback((id: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setCurrentProjectId((prev) => (prev === id ? null : prev));
    }, [setProjects, setCurrentProjectId]);

    const saveProjectData = useCallback((id: string, data: ProjectData) => {
        setProjects((prev) =>
            prev.map((p) => (p.id === id ? {...p, ...data, updatedAt: Date.now()} : p))
        );
    }, [setProjects]);

    const currentProject = useMemo(
        () => projects.find((p) => p.id === currentProjectId) ?? null,
        [projects, currentProjectId]
    );

    const value = useMemo(
        () => ({
            projects,
            currentProjectId,
            currentProject,
            createProject,
            openProject,
            renameProject,
            deleteProject,
            saveProjectData,
        }),
        [projects, currentProjectId, currentProject, createProject, openProject, renameProject, deleteProject, saveProjectData]
    );

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export default ProjectProvider;
