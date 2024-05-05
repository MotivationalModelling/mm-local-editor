import React from "react";
import { PiHandGrabbingLight } from "react-icons/pi";
import "./DragHint.css";

type DragHintProps = {
	isHintVisible: boolean;
};

const DragHint: React.FC<DragHintProps> = ({ isHintVisible }) => {
	return (
		<>
			{isHintVisible && (
				<div className="hint">
					<div className="rectangle" />

					<div className="hand-icon">
						<PiHandGrabbingLight size={40} />
					</div>
				</div>
			)}
		</>
	);
};

export default DragHint;
