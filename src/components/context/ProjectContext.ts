import {createContext, useContext} from "react";
import type {Project, ProjectData} from "../utils/projects";

export type ProjectContextValue = {
    projects: Project[];
    currentProjectId: string | null;
    currentProject: Project | null;
    createProject: (name?: string, data?: ProjectData) => Project;
    openProject: (id: string) => void;
    renameProject: (id: string, name: string) => void;
    deleteProject: (id: string) => void;
    saveProjectData: (id: string, data: Partial<ProjectData>) => void;
};
export const ProjectContext = createContext<ProjectContextValue | null>(null);
export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("useProjectContext must be used within ProjectProvider");
    return context;
};
