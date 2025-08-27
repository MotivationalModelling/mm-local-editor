import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export type ErrorModalProps = {
	show: boolean;
	title: string;
	message: string;
	onHide?: () => void;
};

// Modal for error alert
const ErrorModal: React.FC<ErrorModalProps> = ({
	show,
	title,
	message,
	onHide,
}) => {
	return (
		<Modal show={show} onHide={onHide} centered>
			<Modal.Header closeButton>
				<Modal.Title>{title}</Modal.Title>
			</Modal.Header>
			<Modal.Body>{message}</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onHide}>
					Close
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default ErrorModal;
