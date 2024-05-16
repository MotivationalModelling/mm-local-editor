import React from "react";
import { FiPlus } from "react-icons/fi";
import "./FileDrop.css";

type FileDropProps = {
	onClick: (event: React.DragEvent<HTMLDivElement>) => void;
	onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
	onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
	onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
	isDragOver: boolean;
	fileType: string;
};

// File drop section for drop json file depending on passing props
const FileDrop = ({
	onDrop,
	onDragOver,
	onDragLeave,
	onClick,
	isDragOver,
	fileType,
}: FileDropProps) => {
	return (
		<div
			className={`drop-area ${isDragOver ? "drag-over" : ""}`}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			onClick={onClick}
		>
			<FiPlus className="plus-icon" /> {/* Plus icon */}
			<p>Drop {fileType} file here</p>
		</div>
	);
};

export default FileDrop;
