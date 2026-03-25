import {Link} from "react-router-dom";

type WelcomeFooterProps = {
	name: string;
	destination: string;
};

// Footer section in welcome page including copyrights, papers, user manual...
const WelcomeFooter = ({name, destination}: WelcomeFooterProps) => {
	return (
		<div className="text-center mt-auto">
			<p>
				<Link to={`/${destination}`} className="text-decoration-none">
					{name}
				</Link>
				&nbsp;|&nbsp;
				<Link
					to="/papers/usermanual.pdf"
					target="_blank"
					className="text-decoration-none"
				>
					User Manual
				</Link>
			</p>
		</div>
	);
};

export default WelcomeFooter;
