import FormEvent from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

type ProjectBackgroundModalProps = {
  show: boolean;
  projectBackground: string;
  onProjectBackgroundChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: (projectBackground: string) => void;
};

const ProjectBackgroundModal = ({
  show,
  projectBackground,
  onProjectBackgroundChange,
  onCancel,
  onConfirm,
}: ProjectBackgroundModalProps) => {
  const normalizedBackground = projectBackground.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (normalizedBackground.length === 0) return;
    onConfirm(normalizedBackground);
  };

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Generate User Stories</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="project-background">
            <Form.Label>Project background</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              required
              autoFocus
              value={projectBackground}
              onChange={(event) => onProjectBackgroundChange(event.target.value)}
              placeholder="Describe the project, its users, and the problem it addresses."
            />
            <Form.Text className="text-muted">
              The AI uses this context to infer a direct, relevant immediate user value.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={normalizedBackground.length === 0}>
            Generate
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProjectBackgroundModal;
