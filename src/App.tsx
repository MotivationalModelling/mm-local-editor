import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";
import ModelInput from "./components/ModelInput";

const App = () => {
  return (
    <div id="bg" className=" text-center">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/projectEdit" element={<ProjectEdit />} />
          <Route path="/input" element={<ModelInput />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
