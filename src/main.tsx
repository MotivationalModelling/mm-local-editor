import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "@maxgraph/core/css/common.css";
import "react-nestable/dist/styles/index.css";

import App from "./App.tsx";
import "./index.css";
import FileProvider from "./components/context/FileProvider.tsx";
import {Provider} from "react-redux";
import {store} from "./app/store.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <FileProvider>
            <App/>
        </FileProvider>
    </Provider>
);
