import {useMemo, useState} from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import {BsArrowClockwise, BsCheckCircle, BsClipboard, BsDownload, BsPencilSquare, BsThreeDotsVertical, BsTrash3} from "react-icons/bs";
import ProjectBackgroundModal from "./ProjectBackgroundModal";
import {useFileContext} from "./context/FileProvider";
import {useUserStories, UserStory} from "./context/UserStoriesContext";
import {checkConsistencyPrinciples} from "./utils/consistencyChecker";
import {extractModelForPrompt} from "./utils/modelExtractor";
import {generateValidatedUserStories} from "./utils/userStoryGeneration";
import {splitUserStorySentence} from "./utils/userStorySentence";
import type {UserStoryEdits} from "./userStoryTypes";
import InlineStoryPhrase from "./InlineStoryPhrase";
import GenerateUserStoriesButton from "./header/GenerateUserStoriesButton";
import "./UserStoriesPanel.css";

const EMPTY_EDITS: UserStoryEdits = {role: "", action: "", immediateUserValue: ""};


export const getStoryText = (story: UserStory): string => {
  return story.editedText.trim().length > 0 ? story.editedText : story.sentence;
};

const exportStoriesAsTxt = (stories: UserStory[]): void => {
  const text = stories
    .map((s) => getStoryText(s).trim())
    .join("\n\n");

  const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "user-stories.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copyStoriesToClipboard = async (stories: UserStory[]): Promise<void> => {
  const text = stories
    .map((s) => getStoryText(s).trim())
    .join("\n\n");

  await navigator.clipboard.writeText(text);
};

const UserStoriesPanel = () => {
  const {treeData} = useFileContext();
  const {state: usState, dispatch: usDispatch} = useUserStories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserStoryEdits>(EMPTY_EDITS);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [projectBackground, setProjectBackground] = useState("");

  const extractedModel = useMemo(() => extractModelForPrompt(treeData), [treeData]);
  const cpResults = useMemo(() => {
    if (usState.status !== "success") return [];
    return checkConsistencyPrinciples(extractedModel, usState.stories);
  }, [extractedModel, usState.status, usState.stories]);

  const passedCount = cpResults.filter((r) => r.passed).length;

  const approvedStories = usState.stories.filter((s) => s.status === "approved");
  const approvedCount = approvedStories.length;
  const totalCount = usState.stories.length;

  const handleStartEdit = (s: UserStory) => {
    setEditingId(s.id);
    setDraft({role: s.role, action: s.action, immediateUserValue: s.immediateUserValue});
  };

  const handleSaveEdit = (id: string) => {
    if (Object.values(draft).some((value) => !value.trim())) return;
    usDispatch({type: "EDIT", payload: {id, edits: draft}});
    setEditingId(null);
    setDraft(EMPTY_EDITS);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraft(EMPTY_EDITS);
  };

  const handleCopyApproved = async () => {
    setClipboardError(null);
    try {
      await copyStoriesToClipboard(approvedStories);
    } catch (err) {
      usDispatch({type: "SET_ERROR", payload: err instanceof Error ? err.message : "Unknown error"});
      setClipboardError("Failed to copy to clipboard");
    }
  };

  const handleRegenerate = async (background: string) => {
    setShowBackgroundModal(false);
    usDispatch({type: "CLEAR"});
    usDispatch({type: "SET_LOADING"});
    try {
      const result = await generateValidatedUserStories(extractedModel, background);
      usDispatch({type: "SET_SUCCESS", payload: result});
    } catch (err) {
      usDispatch({type: "SET_ERROR", payload: err instanceof Error ? err.message : "Unknown error"});
    }
  };

  const isLoading = usState.status === "loading";

  return (
    <div className="p-3">
      {usState.status === "error" && usState.error && (
        <Alert variant="danger">{usState.error}</Alert>
      )}
      {clipboardError && <Alert variant="danger">{clipboardError}</Alert>}

      <div className="row g-3">
        <div className="col-12">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Consistency principles</span>
              {usState.status === "success" && (
                <Badge bg={passedCount === cpResults.length ? "success" : "secondary"}>
                  {passedCount}/{cpResults.length}
                </Badge>
              )}
            </Card.Header>
            <Card.Body style={{maxHeight: "70vh", overflow: "auto"}}>
              {usState.status === "success" ? (
                <Table striped bordered size="sm" responsive className="mb-0">
                  <thead>
                    <tr>
                      <th style={{width: "3rem"}}>CP</th>
                      <th>Description</th>
                      <th style={{width: "4rem"}}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cpResults.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.description}</td>
                        <td className={`text-center align-middle ${r.passed ? "text-success" : "text-danger"}`}>
                          {r.passed ? "✓" : "✗"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <span className="text-muted" style={{fontSize: "0.9rem"}}>
                  Generate user stories to see the consistency check.
                </span>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="col-12">
          <div className="user-stories-toolbar">
            <div className="user-stories-toolbar-heading">
            <div className="d-flex align-items-center flex-nowrap gap-1">
              <strong className="fs-4">User stories</strong>
              <Dropdown>
                <Dropdown.Toggle
                  id="user-stories-actions"
                  variant="light"
                  className="user-stories-menu-toggle"
                  aria-label="User stories actions"
                  title="User stories actions"
                >
                  <BsThreeDotsVertical aria-hidden="true"/>
                </Dropdown.Toggle>
                <Dropdown.Menu className="user-stories-menu">
                  <Dropdown.Header>Approved stories</Dropdown.Header>
                  <Dropdown.Item
                    as="button"
                    onClick={() => exportStoriesAsTxt(approvedStories)}
                    disabled={approvedStories.length === 0 || isLoading}
                  >
                    <BsDownload aria-hidden="true"/>
                    <span>Export as .txt</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as="button"
                    onClick={handleCopyApproved}
                    disabled={approvedStories.length === 0 || isLoading}
                  >
                    <BsClipboard aria-hidden="true"/>
                    <span>Copy to clipboard</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className="d-flex align-items-center gap-2">
            {usState.status !== "idle" && (
              <span
                className={`user-stories-approved${approvedCount > 0 ? " user-stories-approved--active" : ""}`}
                role="status"
              >
                <BsCheckCircle aria-hidden="true"/>
                <span>Approved: {approvedCount} / {totalCount}</span>
              </span>
            )}
              {usState.selectedStoryId && (
                <Button size="sm" variant="outline-secondary" onClick={() => usDispatch({type: "SELECT", payload: null})}>
                  Clear selection
                </Button>
              )}
            </div>
            </div>
            <div className="user-stories-toolbar-actions">
              {totalCount === 0 ? <GenerateUserStoriesButton/> : (
                <Button
                  variant="outline-warning"
                  className="user-stories-generation"
                  onClick={() => setShowBackgroundModal(true)}
                  disabled={isLoading}
                >
                  <BsArrowClockwise aria-hidden="true"/>
                  Regenerate
                </Button>
              )}
            </div>
          </div>
          {usState.stories.map((s) => {
            const isRejected = s.status === "rejected";
            const isApproved = s.status === "approved";
            const showEdit = editingId === s.id;
            const isSelected = usState.selectedStoryId === s.id;

            const textToShow = getStoryText(s);
            const sentenceParts = splitUserStorySentence(textToShow);

            return (
              <Card
                key={s.id}
                className={`mb-3 user-story-card ${isRejected ? "opacity-50" : ""} ${isSelected ? "user-story-card--selected" : ""}`}
                style={isApproved ? {borderLeft: "4px solid green"} : undefined}
                onClick={() => {
                  if (!isLoading) usDispatch({type: "SELECT", payload: s.id});
                }}
              >
                <Card.Header className="d-flex align-items-center gap-2 user-story-card-header">
                  <div className="d-flex align-items-center flex-wrap gap-2 user-story-card-heading">
                    <Form.Check
                      type="radio"
                      name="selected-user-story"
                      id={`select-story-${s.id}`}
                      aria-label={`Select user story: ${s.action}`}
                      checked={isSelected}
                      disabled={isLoading}
                      onChange={() => usDispatch({type: "SELECT", payload: s.id})}
                    />
                    <Badge bg="primary" className="me-2">
                      {s.role}
                    </Badge>
                    <span>{s.action}</span>
                  </div>
                  <div className="user-story-card-actions">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="user-story-action user-story-edit"
                      onClick={() => handleStartEdit(s)}
                      disabled={isLoading || showEdit}
                    >
                      <BsPencilSquare aria-hidden="true" />
                      Edit
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className={`user-story-sentence${isRejected && !showEdit ? " user-story-sentence--rejected" : ""}`}>
                    {sentenceParts ? (
                      <>
                        <span className="user-story-phrase--fixed" contentEditable={false}>{sentenceParts.prefix}</span>
                        <InlineStoryPhrase
                          value={showEdit ? draft.role : sentenceParts.role}
                          label="Role"
                          editing={showEdit && !isLoading}
                          autoFocus
                          onChange={(role) => setDraft((previous) => ({...previous, role}))}
                          onCancel={handleCancelEdit}
                        />
                        <span className="user-story-phrase--fixed" contentEditable={false}>{sentenceParts.actionPrefix}</span>
                        <InlineStoryPhrase
                          value={showEdit ? draft.action : sentenceParts.action}
                          label="Action"
                          editing={showEdit && !isLoading}
                          onChange={(action) => setDraft((previous) => ({...previous, action}))}
                          onCancel={handleCancelEdit}
                        />
                        <span className="user-story-phrase--fixed" contentEditable={false}>{sentenceParts.valuePrefix}</span>
                        <InlineStoryPhrase
                          value={showEdit ? draft.immediateUserValue : sentenceParts.immediateUserValue}
                          label="Immediate user value"
                          editing={showEdit && !isLoading}
                          onChange={(immediateUserValue) => setDraft((previous) => ({...previous, immediateUserValue}))}
                          onCancel={handleCancelEdit}
                        />
                        <span className="user-story-phrase--fixed" contentEditable={false}>{sentenceParts.suffix}</span>
                      </>
                    ) : textToShow}
                  </p>
                  {showEdit && (
                    <div className="mt-2 d-flex gap-2">
                      <Button size="sm" variant="success" onClick={() => handleSaveEdit(s.id)}
                              disabled={isLoading || Object.values(draft).some((value) => !value.trim())}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-end gap-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (showEdit) handleCancelEdit();
                      usDispatch({type: "DELETE", payload: s.id});
                    }}
                    disabled={isLoading}
                  >
                    <BsTrash3 className="me-1" aria-hidden="true" />
                    Delete
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => usDispatch({type: "APPROVE", payload: s.id})}
                    disabled={isLoading}
                  >
                    <BsCheckCircle className="me-1" />
                    Approve
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      </div>
      <ProjectBackgroundModal
        show={showBackgroundModal}
        projectBackground={projectBackground}
        onProjectBackgroundChange={setProjectBackground}
        onCancel={() => setShowBackgroundModal(false)}
        onConfirm={handleRegenerate}
      />
    </div>
  );
};

export default UserStoriesPanel;
