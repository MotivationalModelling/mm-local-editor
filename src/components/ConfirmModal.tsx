import React from "react";
import { Modal, Button } from "react-bootstrap";

export type ConfirmModalProps = {
	show: boolean;
	title: string;
	message: string;
	onHide?: () => void;
	onConfirm: () => void;
	extraContent?: React.ReactNode
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	show,
	title,
	message,
	onHide,
	onConfirm,
	extraContent,
}) => {
	return (
		<Modal show={show} onHide={onHide} centered>
			<Modal.Header closeButton>
				<Modal.Title>{title}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{message}
				{extraContent}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onHide}>
					Close
				</Button>
				<Button variant="warning" onClick={onConfirm}>
					Confirm
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default ConfirmModal;
