import {useNavigate} from "react-router-dom";
import {useProjectContext} from "../context/ProjectContext";
import {parseModelJson, type JSONData} from "../modelJson";
import {extractJsonFromPng, extractJsonFromSvg} from "./imageMetadata";
import {convertTabContentToInitialTab} from "./modelImport";
import {uniqueProjectName, type Project} from "./projects";

export const useProjectLauncher = () => {
    const {projects, createProject, openProject} = useProjectContext();
    const navigate = useNavigate();
    const openEditor = (project: Project) => {
        openProject(project.id);
        navigate("/projectEdit");
    };
    const launchNewProject = () => openEditor(createProject());
    const importProjectFile = async (file: File) => {
        const lower = file.name.toLowerCase();
        const embedded = lower.endsWith(".png") ? await extractJsonFromPng(file)
            : lower.endsWith(".svg") ? await extractJsonFromSvg(file) : null;
        if (!lower.endsWith(".json") && !lower.endsWith(".png") && !lower.endsWith(".svg")) {
            throw new Error("Please select a JSON, PNG, or SVG file.");
        }
        if (!lower.endsWith(".json") && embedded === null) {
            throw new Error("This image does not contain an AMMBER model.");
        }
        const data: JSONData = parseModelJson(lower.endsWith(".json") ? await file.text() : JSON.stringify(embedded));
        const base = file.name.replace(/\.[^.]+$/, "").trim() || "Untitled";
        const name = uniqueProjectName(base, projects.map((project) => project.name));
        openEditor(createProject(name, {
            tabData: convertTabContentToInitialTab(data.tabData, data.treeData),
            treeData: data.treeData,
            feedbacks: data.feedbacks ?? [],
            overallFeedback: data.overallFeedback,
        }));
    };
    return {openEditor, launchNewProject, importProjectFile};
};
