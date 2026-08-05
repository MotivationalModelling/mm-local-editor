import React, {useState} from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import {TreeGoal} from "./types.ts";
import {linkTitleForGoal} from "./linkTitleForGoal.ts";

type GoalLinkModalProps = {
	show: boolean;
	goal: TreeGoal | null;
	onHide: () => void;
	onRemove: () => void;
	onSave: (url: string) => void;
};

const GoalLinkModal: React.FC<GoalLinkModalProps> = ({
	show,
	goal,
	onHide,
	onRemove,
	onSave,
}) => {
	const [url, setUrl] = useState(goal?.url ?? "");
	const normalizedUrl = url.trim();

	const isValidUrl = () => {
		try {
			const parsedUrl = new URL(normalizedUrl);
			return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
		} catch {
			return false;
		}
	};

	const isUrlValid = isValidUrl();
	const showInvalidUrl = url.length > 0 && !isUrlValid;

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isUrlValid) {
			onSave(normalizedUrl);
		}
	};

	const handleOpen = () => {
		if (isUrlValid) {
			window.open(normalizedUrl, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<Modal show={show} onHide={onHide} centered>
			<Modal.Header closeButton>
				<Modal.Title>{linkTitleForGoal(goal)}</Modal.Title>
			</Modal.Header>
			<Form onSubmit={handleSubmit}>
				<Modal.Body>
					<Form.Group controlId="goal-related-link">
						<Form.Label>URL</Form.Label>
						<Form.Control
							type="url"
							value={url}
							placeholder="Enter an http:// or https:// URL"
							isInvalid={showInvalidUrl}
							onChange={(event) => setUrl(event.target.value)}
							autoFocus
						/>
						<Form.Control.Feedback type="invalid">
							Enter a valid http:// or https:// URL.
						</Form.Control.Feedback>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button
						type="button"
						variant="outline-primary"
						className="me-auto"
						disabled={!isUrlValid}
						onClick={handleOpen}
					>
						Open link
					</Button>
					{goal?.url && (
						<Button type="button" variant="outline-danger" onClick={onRemove}>
							Remove
						</Button>
					)}
					<Button type="submit" variant="primary" disabled={!isUrlValid}>
						Save
					</Button>
				</Modal.Footer>
			</Form>
		</Modal>
	);
};

export default GoalLinkModal;
