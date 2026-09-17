import {Link} from "react-router-dom";

type WelcomeFooterProps = {
	onPapersClick?: () => void;
};

const WelcomeFooter = ({onPapersClick}: WelcomeFooterProps) => {
	return (
		<div className="text-center mt-auto">
			<p>
                <span
					onClick={onPapersClick}
					className="text-decoration-none"
					style={{cursor: "pointer", color: "#0d6efd"}}
				>
                    Papers
                </span>
				&nbsp;|&nbsp;
				<Link
					to="/papers/AMMBER_User_Manual.pdf"
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
