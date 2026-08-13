import React from "react";
import Modal from "react-bootstrap/Modal";
import {BsExclamationTriangle, BsX} from "react-icons/bs";
import styles from "./ConfirmModal.module.css";

export type ConfirmModalProps = {
	show: boolean;
	title: string;
	message: React.ReactNode;
	onHide?: () => void;
	onConfirm: () => void;
	extraContent?: React.ReactNode;
	confirmLabel?: string;
	destructive?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	show,
	title,
	message,
	onHide,
	onConfirm,
	extraContent,
	confirmLabel = "Confirm",
	destructive = false,
}) => {
	return (
		<Modal
			show={show}
			onHide={onHide}
			centered
			dialogClassName={styles.dialog}
			contentClassName={styles.content}
			backdropClassName={styles.backdrop}
		>
			<Modal.Header className={styles.header}>
				<div className={styles.titleGroup}>
					<span className={`${styles.icon} ${destructive ? styles.iconDanger : ""}`}>
						<BsExclamationTriangle/>
					</span>
					<Modal.Title className={styles.title}>{title}</Modal.Title>
				</div>
				<button type="button" className={styles.closeButton} onClick={onHide} aria-label="Close">
					<BsX/>
				</button>
			</Modal.Header>
			<Modal.Body className={styles.body}>
				{message}
				{extraContent}
			</Modal.Body>
			<Modal.Footer className={styles.footer}>
				<button type="button" className={styles.cancelButton} onClick={onHide}>
					Cancel
				</button>
				<button
					type="button"
					className={`${styles.confirmButton} ${destructive ? styles.confirmDanger : ""}`}
					data-cy="confirm-delete"
					onClick={onConfirm}
				>
					{confirmLabel}
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default ConfirmModal;
