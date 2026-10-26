import React, {useCallback, useEffect, useMemo, useState} from "react";
import {initialTabs} from "../../data/initialTabs";
import {createInitialState} from "./treeDataSlice";
import {ProjectContext} from "./ProjectContext";
import {defaultProjectName, newProjectData, newProjectId, type Project, type ProjectData} from "../utils/projects";

const PROJECTS_KEY = "ammber/projects";
const CURRENT_KEY = "ammber/currentProjectId";

// Bring the single-model workspace forward once. The old keys remain intact.
const readProjects = (): Project[] => {
    try {
        const saved = localStorage.getItem(PROJECTS_KEY);
        if (saved !== null) {
            const parsed: unknown = JSON.parse(saved);
            return Array.isArray(parsed) ? (parsed as Project[]).map((project) => {
                try {
                    return {...project, treeData: createInitialState(project.tabData, project.treeData).tree};
                } catch {
                    return project;
                }
            }) : [];
        }
        const treeRaw = localStorage.getItem("ammber/treeData");
        const tabsRaw = localStorage.getItem("ammber/tabData");
        if (treeRaw === null && tabsRaw === null) return [];
        const treeData = JSON.parse(treeRaw ?? "[]");
        const tabData = JSON.parse(tabsRaw ?? JSON.stringify(initialTabs));
        const normalizedTreeData = createInitialState(tabData, treeData).tree;
        const feedback = JSON.parse(localStorage.getItem("ammber/feedback") ?? "null");
        const now = Date.now();
        return [{
            id: newProjectId(), name: "My model", treeData: normalizedTreeData, tabData,
            feedbacks: Array.isArray(feedback?.feedbacks) ? feedback.feedbacks : [],
            overallFeedback: feedback?.overallFeedback,
            createdAt: now, updatedAt: now,
        }];
    } catch (error) {
        console.error("Existing model could not be migrated; original storage was kept.", error);
        return [];
    }
};

export const ProjectProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const [projects, setProjects] = useState<Project[]>(readProjects);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(() =>
        localStorage.getItem(CURRENT_KEY));
    useEffect(() => {
        // A failed legacy migration leaves its original keys available for repair.
        if (projects.length > 0 || localStorage.getItem(PROJECTS_KEY) !== null) {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        }
    }, [projects]);
    useEffect(() => {
        if (currentProjectId) localStorage.setItem(CURRENT_KEY, currentProjectId);
        else localStorage.removeItem(CURRENT_KEY);
    }, [currentProjectId]);

    const createProject = useCallback((name?: string, data?: ProjectData) => {
        const now = Date.now();
        const project: Project = {
            ...newProjectData(), ...data, id: newProjectId(),
            name: name?.trim() || defaultProjectName(projects.map((item) => item.name)),
            createdAt: now, updatedAt: now,
        };
        setProjects((previous) => [project, ...previous]);
        setCurrentProjectId(project.id);
        return project;
    }, [projects]);
    const openProject = useCallback((id: string) => {
        if (projects.some((project) => project.id === id)) setCurrentProjectId(id);
    }, [projects]);
    const renameProject = useCallback((id: string, name: string) => {
        if (!name.trim()) return;
        setProjects((previous) => previous.map((project) =>
            project.id === id ? {...project, name: name.trim()} : project));
    }, []);
    const deleteProject = useCallback((id: string) => {
        setProjects((previous) => previous.filter((project) => project.id !== id));
        setCurrentProjectId((current) => current === id ? null : current);
    }, []);
    const saveProjectData = useCallback((id: string, data: Partial<ProjectData>) => {
        setProjects((previous) => previous.map((project) =>
            project.id === id ? {...project, ...data, updatedAt: Date.now()} : project));
    }, []);
    const currentProject = useMemo(() => projects.find((project) => project.id === currentProjectId) ?? null,
        [projects, currentProjectId]);
    return <ProjectContext.Provider value={{
        projects, currentProjectId, currentProject, createProject, openProject,
        renameProject, deleteProject, saveProjectData,
    }}>{children}</ProjectContext.Provider>;
};
