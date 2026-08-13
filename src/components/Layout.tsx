import React from "react";
import {useLocation} from "react-router-dom";
import Footer from "./Footer";

type LayoutProps = {
	children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({children}) => {
	const {pathname} = useLocation();
	const showFooter = pathname !== "/" && pathname !== "/papers" && pathname !== "/projects";

	return (
		<>
			<div style={{minHeight: "100vh"}}>{children}</div>
			{showFooter && <Footer />}
		</>
	);
};

export default Layout;
