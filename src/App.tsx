import {BrowserRouter, Routes, Route} from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";
import Layout from "./components/Layout";

const App = () => {
	return (
		<BrowserRouter basename={import.meta.env.BASE_URL}>
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
