import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "@maxgraph/core/css/common.css";
import "react-nestable/dist/styles/index.css";

import App from "./App.tsx";
import "./index.css";
import FileProvider from "./components/context/FileProvider.tsx";
import {ProfileProvider} from "./components/context/ProfileContext.tsx";
import {FeedbackProvider} from "./components/context/FeedbackContext.tsx";
import {enableMapSet} from "immer";
import {ProjectProvider} from "./components/context/ProjectProvider.tsx";
import {useProjectContext} from "./components/context/ProjectContext.ts";

enableMapSet();

const rootContainer = document.getElementById("root");
const Workspace = () => {
    const {currentProjectId} = useProjectContext();
    return <FileProvider key={currentProjectId ?? "legacy"}>
        <ProfileProvider>
            <FeedbackProvider key={currentProjectId ?? "legacy"}><App/></FeedbackProvider>
        </ProfileProvider>
    </FileProvider>;
};
ReactDOM.createRoot(rootContainer!).render(<ProjectProvider><Workspace/></ProjectProvider>);
