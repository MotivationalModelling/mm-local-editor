import {useMemo, useState} from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import {BsCheckCircle, BsPencilSquare, BsXCircle} from "react-icons/bs";
import {useFileContext} from "./context/FileProvider";
import {parseStoriesFromText, useUserStories, UserStory} from "./context/UserStoriesContext";
import {checkConsistencyPrinciples} from "./utils/consistencyChecker";
import {extractModelForPrompt} from "./utils/modelExtractor";
import {generateUserStories} from "./utils/llmService";
import {buildUserStoryPrompt} from "./utils/promptBuilder";

const buildStorySentence = (s: UserStory): string => {
  return `As a ${s.role}, I want to ${s.action} so that ${s.qualityGoal}. I want to feel ${s.emotionalGoal}.`;
};

const exportStoriesAsTxt = (stories: UserStory[]): void => {
  const text = stories
    .map((s) => {
      const header = s.editedText.trim().length > 0 ? s.editedText.trim() : buildStorySentence(s);
      const tasks = s.subTasks.map((t) => `  - ${t}`).join("\n");
      return tasks.length > 0 ? `${header}\n${tasks}` : header;
    })
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
    .map((s) => {
      const header = s.editedText.trim().length > 0 ? s.editedText.trim() : buildStorySentence(s);
      const tasks = s.subTasks.map((t) => `  - ${t}`).join("\n");
      return tasks.length > 0 ? `${header}\n${tasks}` : header;
    })
    .join("\n\n");

  await navigator.clipboard.writeText(text);
};

const UserStoriesPanel = () => {
  const {treeData} = useFileContext();
  const {state: usState, dispatch: usDispatch} = useUserStories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>("");
  const [clipboardError, setClipboardError] = useState<string | null>(null);

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
    setDraftText(s.editedText.trim().length > 0 ? s.editedText : buildStorySentence(s));
  };

  const handleSaveEdit = (id: string) => {
    usDispatch({type: "EDIT", payload: {id, text: draftText}});
    setEditingId(null);
    setDraftText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftText("");
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

  const handleRegenerate = async () => {
    usDispatch({type: "CLEAR"});
    usDispatch({type: "SET_LOADING"});
    try {
      const prompt = buildUserStoryPrompt(extractedModel);
      const raw = await generateUserStories(prompt);
      const stories = parseStoriesFromText(raw);
      usDispatch({type: "SET_SUCCESS", payload: {rawOutput: raw, stories}});
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
        <div className="col-12 col-lg-4">
          {usState.status === "success" && (
            <>
              <div className="mb-2">
                <strong>{passedCount} / 9 consistency principles satisfied</strong>
              </div>
              <Table striped bordered size="sm" responsive>
                <thead>
                  <tr>
                    <th>CP</th>
                    <th>Description</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {cpResults.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.description}</td>
                      <td className={r.passed ? "text-success" : "text-danger"}>
                        {r.passed ? "✓" : "✗"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </div>
        <div className="col-12 col-lg-8">
          {usState.stories.map((s) => {
            const isRejected = s.status === "rejected";
            const isApproved = s.status === "approved";
            const isEdited = s.status === "edited";
            const showEdit = editingId === s.id;

            const textToShow = showEdit ? draftText : isEdited && s.editedText.trim().length > 0 ? s.editedText : buildStorySentence(s);

            return (
              <Card
                key={s.id}
                className={`mb-3 ${isRejected ? "opacity-50" : ""}`}
                style={isApproved ? {borderLeft: "4px solid green"} : undefined}
              >
                <Card.Header>
                  <Badge bg="primary" className="me-2">
                    {s.role}
                  </Badge>
                  <span>{s.action}</span>
                </Card.Header>
                <Card.Body>
                  {showEdit ? (
                    <>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                      />
                      <div className="mt-2 d-flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleSaveEdit(s.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {isRejected ? <p><s>{textToShow}</s></p> : <p>{textToShow}</p>}
                      {s.subTasks.length > 0 && (
                        <ul className="mt-2">
                          {s.subTasks.map((t, idx) => (
                            <li key={`${s.id}-${idx}`}>{isRejected ? <s>{t}</s> : t}</li>
                          ))}
                        </ul>
                      )}
                      <div className="d-flex gap-2">
                        <Badge bg="info" className="me-2">{s.qualityGoal}</Badge>
                        <Badge bg="warning" text="dark">
                          {s.emotionalGoal}
                        </Badge>
                      </div>
                    </>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => usDispatch({type: "APPROVE", payload: s.id})}
                    disabled={isLoading}
                  >
                    <BsCheckCircle className="me-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleStartEdit(s)}
                    disabled={isLoading}
                  >
                    <BsPencilSquare className="me-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => usDispatch({type: "REJECT", payload: s.id})}
                    disabled={isLoading}
                  >
                    <BsXCircle className="me-1" />
                    Reject
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      </div>

      {usState.status !== "idle" && (
        <div className="d-flex align-items-center gap-3 mt-3">
          <Badge bg="secondary">Approved: {approvedCount} / {totalCount}</Badge>
          <Button
            variant="success"
            onClick={() => exportStoriesAsTxt(approvedStories)}
            disabled={approvedStories.length === 0 || isLoading}
          >
            Export approved stories as .txt
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleCopyApproved}
            disabled={approvedStories.length === 0 || isLoading}
          >
            Copy all approved to clipboard
          </Button>
          <Button
            variant="outline-warning"
            onClick={handleRegenerate}
            disabled={isLoading}
          >
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserStoriesPanel;
