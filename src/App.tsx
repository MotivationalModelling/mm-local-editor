import {BrowserRouter, Route, Routes} from "react-router-dom";
import Welcome from "./components/Welcome";
import Papers from "./components/Papers";
import ProjectEdit from "./components/ProjectEdit";
import Layout from "./components/Layout";
import {getBasename} from "./components/utils/basename";

const basename = getBasename();

const App = () => {
	return (
		<BrowserRouter basename={basename}>
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
