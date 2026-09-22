import React from "react";
import Footer from "./Footer";

type LayoutProps = {
	children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({children}) => {
	return (
		<>
			{/* Possible header content */}
			<div style={{minHeight: "100vh"}}>{children}</div>
			<Footer />
		</>
	);
};

export default Layout;
