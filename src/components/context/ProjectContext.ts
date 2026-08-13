import {createContext, useContext} from "react";
import {InitialTab} from "../../data/initialTabs";
import {TreeGoal} from "../types";
import {Project} from "../utils/projects";

export type ProjectData = {
    treeData: TreeGoal[];
    tabData: InitialTab[];
};

export type ProjectContextValue = {
    projects: Project[];
    currentProjectId: string | null;
    currentProject: Project | null;
    createProject: (name?: string, data?: ProjectData) => Project;
    openProject: (id: string) => void;
    renameProject: (id: string, name: string) => void;
    deleteProject: (id: string) => void;
    saveProjectData: (id: string, data: ProjectData) => void;
};

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const useProjectContext = (): ProjectContextValue => {
    const ctx = useContext(ProjectContext);
    if (!ctx) {
        throw new Error("useProjectContext must be used within ProjectProvider.");
    }
    return ctx;
};
