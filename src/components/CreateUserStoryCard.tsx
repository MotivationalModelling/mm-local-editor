import {useMemo, useState, type FormEvent} from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import {BsArrowLeft, BsLink45Deg, BsPlusLg, BsX} from "react-icons/bs";
import InlineStoryPhrase from "./InlineStoryPhrase";
import type {InstanceId, TreeGoal} from "./types";
import type {UserStory, UserStoryEdits} from "./userStoryTypes";
import {splitUserStorySentence} from "./utils/userStorySentence";
import {extractModelForPrompt} from "./utils/modelExtractor";

type Props = {
  treeData: TreeGoal[];
  initialEpicInstanceId?: InstanceId;
  onCancel: () => void;
  onCreate: (story: UserStory) => void;
  disabled?: boolean;
};

const CreateUserStoryCard = ({treeData, initialEpicInstanceId, onCancel, onCreate, disabled = false}: Props) => {
  const [step, setStep] = useState<"write" | "link">("write");
  const [draft, setDraft] = useState<UserStoryEdits>({role: "", action: "", immediateUserValue: ""});
  const [epicId, setEpicId] = useState<InstanceId | "">(initialEpicInstanceId ?? "");
  const [sourceId, setSourceId] = useState<InstanceId | "">("");
  const model = useMemo(() => extractModelForPrompt(treeData), [treeData]);
  const epic = model.epics.find((item) => item.instanceId === epicId);
  const sources = model.stories.filter((source) => source.epicInstanceId === epicId);
  const source = sources.find((item) => item.functionalGoalInstanceId === sourceId);
  const validLink = !!epic && (!sourceId || !!source);
  const value = draft.immediateUserValue.trim();
  const sentence = `As a ${draft.role.trim()}, I want to ${draft.action.trim()} so that ${value}${/[.!?]$/.test(value) ? "" : "."}`;
  const parts = splitUserStorySentence(sentence);
  const validDraft = Object.values(draft).every((clause) => clause.trim()) && parts !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || !validDraft || !parts) return;
    if (step === "write") {
      setStep("link");
      return;
    }
    if (!validLink || !epic) return;
    onCreate({
      id: crypto.randomUUID(), sentence,
      role: parts.role, action: parts.action, immediateUserValue: parts.immediateUserValue,
      subTasks: [], epicInstanceId: epic.instanceId,
      functionalGoalInstanceId: source?.functionalGoalInstanceId ?? null,
      relatedGoals: source?.goalReferences.map(({goalId, instanceId, type}) => ({goalId, instanceId, type})) ?? [],
      status: "pending", editedText: "",
    });
  };

  return (
    <Form onSubmit={handleSubmit} className="card mb-3 user-story-card user-story-create-card" aria-labelledby="create-user-story-title">
      <Card.Header className="d-flex align-items-center gap-2 user-story-card-header">
        <div className="d-flex align-items-center flex-wrap gap-2 user-story-card-heading">
          <Badge bg="primary" className="me-2">{draft.role.trim() || "Role"}</Badge>
          <span id="create-user-story-title">{draft.action.trim() || "New user story"}</span>
        </div>
        <span className="user-story-card-actions text-muted small">Draft</span>
      </Card.Header>
      <Card.Body>
        <p className="user-story-sentence">
          <span className="user-story-phrase--fixed" contentEditable={false}>As a </span>
          <InlineStoryPhrase value={draft.role} label="Role" placeholder="role" editing={step === "write" && !disabled} autoFocus
            onChange={(role) => setDraft((previous) => ({...previous, role}))} onCancel={onCancel}/>
          <span className="user-story-phrase--fixed" contentEditable={false}>, I want to </span>
          <InlineStoryPhrase value={draft.action} label="Action" placeholder="action" editing={step === "write" && !disabled}
            onChange={(action) => setDraft((previous) => ({...previous, action}))} onCancel={onCancel}/>
          <span className="user-story-phrase--fixed" contentEditable={false}> so that </span>
          <InlineStoryPhrase value={draft.immediateUserValue} label="Business value" placeholder="user value" editing={step === "write" && !disabled}
            onChange={(immediateUserValue) => setDraft((previous) => ({...previous, immediateUserValue}))} onCancel={onCancel}/>
          {!/[.!?]$/.test(value) && <span className="user-story-phrase--fixed" contentEditable={false}>.</span>}
        </p>
        {step === "link" && (
          model.epics.length === 0 ? (
            <Alert variant="info">Add an epic under the central model node before creating a user story.</Alert>
          ) : (
            <div className="user-story-link-fields">
              <Form.Group controlId="new-story-epic">
                <Form.Label>Epic</Form.Label>
                <Form.Select value={epicId} disabled={disabled} onChange={(event) => {
                  setEpicId(event.target.value as InstanceId | "");
                  setSourceId("");
                }}>
                  <option value="">Choose an epic</option>
                  {model.epics.map((item) => <option key={item.instanceId} value={item.instanceId}>{item.title}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group controlId="new-story-functional-goal">
                <Form.Label>Functional goal</Form.Label>
                <Form.Select value={sourceId} disabled={disabled || !epic} onChange={(event) => setSourceId(event.target.value as InstanceId | "")}>
                  <option value="">Create a new leaf from this story’s action</option>
                  {sources.map((item) => <option key={item.functionalGoalInstanceId} value={item.functionalGoalInstanceId}>{item.story}</option>)}
                </Form.Select>
                <Form.Text>{source ? "This story will link to the selected leaf and its model context." : "A new functional goal will be added under the selected epic."}</Form.Text>
              </Form.Group>
            </div>
          )
        )}
      </Card.Body>
      <Card.Footer className="d-flex justify-content-end flex-wrap gap-2">
        <Button size="sm" variant="outline-secondary" disabled={disabled} onClick={onCancel}>
          <BsX size={20} className="me-1" aria-hidden="true"/>Cancel
        </Button>
        {step === "link" && <Button size="sm" variant="outline-secondary" disabled={disabled} onClick={() => setStep("write")}>
          <BsArrowLeft className="me-1" aria-hidden="true"/>Back
        </Button>}
        <Button size="sm" variant="outline-success" type="submit" disabled={disabled || !validDraft || (step === "link" && !validLink)}>
          {step === "write" ? <BsLink45Deg className="me-1" aria-hidden="true"/> : <BsPlusLg className="me-1" aria-hidden="true"/>}
          {step === "write" ? "Link goals" : "Create user story"}
        </Button>
      </Card.Footer>
    </Form>
  );
};

export default CreateUserStoryCard;
