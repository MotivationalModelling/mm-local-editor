import {BrowserRouter, Routes, Route} from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";
import Layout from "./components/Layout";
import SharedModelLoader from "./components/SharedModelLoader";

const App = () => {
	return (
		<BrowserRouter basename="/mm-local-editor/">
			<SharedModelLoader/>
			<Layout>
				<Routes>
					<Route path="/" element={<Welcome />} />
					<Route path="/papers" element={<Papers />} />
					<Route path="/projectEdit" element={<ProjectEdit />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	);
};

export default App;
