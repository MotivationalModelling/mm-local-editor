import {useNavigate} from "react-router-dom";
import {useProjectContext} from "../context/ProjectContext";
import {JSONData, useFileContext} from "../context/FileProvider";
import {reset} from "../context/treeDataSlice";
import {Project, convertTabContentToInitialTab} from "./projects";

type ShowError = (title: string, message: string) => void;

// Shared "start modelling" actions used by the welcome page and the projects home.
export const useProjectLauncher = (showError: ShowError) => {
    const {createProject, openProject} = useProjectContext();
    const {dispatch} = useFileContext();
    const navigate = useNavigate();

    const openEditor = (project: Project) => {
        openProject(project.id);
        dispatch(reset({treeData: project.treeData, tabData: project.tabData}));
        navigate("/projectEdit");
    };

    const launchNewProject = () => {
        openEditor(createProject());
    };

    const importProjectFile = async (file: File) => {
        try {
            if (file.type !== "application/json" && !file.name.endsWith(".json")) {
                showError("Incorrect File Type", "Please select a JSON file.");
                return;
            }
            const fileContent = await file.text();
            const jsonData: JSONData = JSON.parse(fileContent);
            const tabData = convertTabContentToInitialTab(jsonData.tabData, jsonData.treeData);
            openEditor(createProject(undefined, {treeData: jsonData.treeData, tabData}));
        } catch (error) {
            console.error("Error importing JSON file:", error);
            showError("File Upload Failed", "Failed to process the selected file. Please try again.");
        }
    };

    return {openEditor, launchNewProject, importProjectFile};
};
