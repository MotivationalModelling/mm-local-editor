import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/projectEdit" element={<ProjectEdit />} />
        {/* <Route path="/input" element={<ModelInput />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
