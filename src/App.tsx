import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";


const App = () => {
  return (
    <BrowserRouter basename="/mm-local-editor/">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/projectEdit" element={<ProjectEdit />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
