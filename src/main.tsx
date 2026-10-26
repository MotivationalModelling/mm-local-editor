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

enableMapSet();

const rootContainer = document.getElementById("root");
ReactDOM.createRoot(rootContainer!).render(
    <FileProvider>
        <ProfileProvider>
            <FeedbackProvider><App/></FeedbackProvider>
        </ProfileProvider>
    </FileProvider>
);
