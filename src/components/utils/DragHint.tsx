import React from "react";
import { PiHandGrabbingLight } from "react-icons/pi";
import "./DragHint.css";

type DragHintProps = {
	isHintVisible: boolean;
	width: number;
	height: number;
};

const DragHint: React.FC<DragHintProps> = ({ isHintVisible, width = 40, height = 5 }) => {
	return (
		<>
			{isHintVisible && (
				<div className="hint">
					<div className="rectangle" style={{width: width, height: `${height}vh`}} />

					<div className="hand-icon">
						<PiHandGrabbingLight size={40} />
					</div>
				</div>
			)}
		</>
	);
};

export default DragHint;
