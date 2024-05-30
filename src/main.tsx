import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "@maxgraph/core/css/common.css";
import "react-nestable/dist/styles/index.css";

import App from "./App.tsx";
import "./index.css";
import FileProvider from "./components/context/FileProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <FileProvider>
    <App />
  </FileProvider>
);
