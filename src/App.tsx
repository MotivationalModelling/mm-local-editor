import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";

const App = () => {
  return (
    <div id="bg" className=" text-center">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/projectEdit" element={<ProjectEdit />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
