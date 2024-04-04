import { Modal, Button } from "react-bootstrap";

type ErrorModalProps = {
  show: boolean;
  title: string;
  message: string;
  onHide: () => void;
};

// Modal for error alert
const ErrorModal = ({ show, title, message, onHide }: ErrorModalProps) => {
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
