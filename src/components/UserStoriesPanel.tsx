import {useMemo, useState} from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import {BsArrowClockwise, BsChevronDown, BsChevronRight, BsLayers, BsCheckCircle, BsClipboard, BsDownload, BsPencilSquare, BsPlusLg, BsThreeDotsVertical, BsTrash3} from "react-icons/bs";
import CreateUserStoryCard from "./CreateUserStoryCard";
import ProjectBackgroundModal from "./ProjectBackgroundModal";
import {useFileContext} from "./context/FileProvider";
import {useUserStories, UserStory} from "./context/UserStoriesContext";
import {checkConsistencyPrinciples} from "./utils/consistencyChecker";
import {extractModelForPrompt, resolveModelTree} from "./utils/modelExtractor";
import {appendGoalToInstance, groupStoriesByEpic, newFunctionalGoal} from "./utils/userStoryEpics";
import {addGoalUnderInstance} from "./context/treeDataSlice";
import type {InstanceId} from "./types";
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
  const {treeData, goals, dispatch: modelDispatch} = useFileContext();
  const {state: usState, dispatch: usDispatch} = useUserStories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserStoryEdits>(EMPTY_EDITS);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [createInEpic, setCreateInEpic] = useState<InstanceId | undefined>();
  const [showCreateEpic, setShowCreateEpic] = useState(false);
  const [epicTitle, setEpicTitle] = useState("");
  const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set());
  const [projectBackground, setProjectBackground] = useState("");

  const modelTree = useMemo(() => resolveModelTree(treeData, goals), [treeData, goals]);
  const extractedModel = useMemo(() => extractModelForPrompt(modelTree), [modelTree]);
  const groups = useMemo(() => groupStoriesByEpic(extractedModel, usState.stories), [extractedModel, usState.stories]);
  const allExpanded = groups.every((group) => !collapsedEpics.has(group.epic?.instanceId ?? "unlinked"));
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

  const toggleEpic = (id: string) => setCollapsedEpics((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const startCreateStory = (epicId?: InstanceId) => {
    setCreateInEpic(epicId);
    setShowCreateCard(true);
    if (epicId) setCollapsedEpics((previous) => new Set([...previous].filter((id) => id !== epicId)));
  };

  const handleCreateStory = (story: UserStory) => {
    if (!story.epicInstanceId) return;
    const epic = extractedModel.epics.find((item) => item.instanceId === story.epicInstanceId);
    if (!epic) return;
    if (!story.functionalGoalInstanceId) {
      const goal = newFunctionalGoal(story.action, goals);
      const updatedModel = extractModelForPrompt(appendGoalToInstance(modelTree, epic.instanceId, goal));
      const source = updatedModel.stories.find((item) => item.functionalGoalInstanceId === goal.instanceId)!;
      modelDispatch(addGoalUnderInstance({goal, parentInstanceId: epic.instanceId}));
      story = {...story, functionalGoalInstanceId: goal.instanceId,
        relatedGoals: source.goalReferences.map(({goalId, instanceId, type}) => ({goalId, instanceId, type}))};
    }
    usDispatch({type: "ADD", payload: story});
    setCollapsedEpics((previous) => new Set([...previous].filter((id) => id !== epic.instanceId)));
    setShowCreateCard(false);
  };

  const handleCreateEpic = () => {
    const root = modelTree[0];
    if (!epicTitle.trim() || root?.type !== "Do") return;
    const goal = newFunctionalGoal(epicTitle, goals);
    modelDispatch(addGoalUnderInstance({goal, parentInstanceId: root.instanceId}));
    setEpicTitle("");
    setShowCreateEpic(false);
  };

  const renderStory = (s: UserStory) => {
    const isRejected = s.status === "rejected";
    const isApproved = s.status === "approved";
    const showEdit = editingId === s.id;
    const isSelected = usState.selectedStoryId === s.id;

    const textToShow = getStoryText(s);
    const sentenceParts = splitUserStorySentence(textToShow);

    return (
      <Card
        key={s.id}
        className={`user-story-card ${isRejected ? "opacity-50" : ""} ${isSelected ? "user-story-card--selected" : ""}`}
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
                  label="Business value"
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
        <Card.Footer className="user-story-footer">
          <span className="user-story-status">US-{String(usState.stories.findIndex((story) => story.id === s.id) + 1).padStart(2, "0")} · <span className={isApproved ? "text-success" : ""}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span></span>
          <div className="d-flex flex-wrap gap-2">
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
              {isApproved ? "Approved" : "Approve"}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    );
  };

  return (
    <div className="p-3 user-stories-panel">
      {usState.status === "error" && usState.error && (
        <Alert variant="danger">{usState.error}</Alert>
      )}
      {clipboardError && <Alert variant="danger">{clipboardError}</Alert>}

      <div className="row g-3">
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
              <span className="user-stories-count">{extractedModel.epics.length} epic{extractedModel.epics.length === 1 ? "" : "s"} · {totalCount} user stor{totalCount === 1 ? "y" : "ies"}</span>
            </div>
            <div className="user-stories-toolbar-actions">
              <Button variant="outline-secondary" disabled={isLoading || showCreateEpic || modelTree[0]?.type !== "Do"}
                onClick={() => setShowCreateEpic(true)}>
                <BsLayers className="me-2" aria-hidden="true"/>Add epic
              </Button>
              <Button variant="primary" disabled={isLoading || showCreateCard || extractedModel.epics.length === 0} onClick={() => startCreateStory()}>
                <BsPlusLg className="me-2" aria-hidden="true"/>
                Add user story
              </Button>
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
          <div className="user-stories-summary">
            <span className={`user-stories-approved${approvedCount > 0 ? " user-stories-approved--active" : ""}`} role="status">
              <BsCheckCircle aria-hidden="true"/><span>Approved: {approvedCount} / {totalCount}</span>
            </span>
            <div className="d-flex flex-wrap gap-2">
              {usState.selectedStoryId && <Button size="sm" variant="outline-secondary" onClick={() => usDispatch({type: "SELECT", payload: null})}>Clear selection</Button>}
              {groups.length > 0 && <Button variant="link" onClick={() => setCollapsedEpics(allExpanded
                ? new Set(groups.map((group) => group.epic?.instanceId ?? "unlinked")) : new Set())}>
                {allExpanded ? "Collapse all" : "Expand all"}
              </Button>}
            </div>
          </div>
          {showCreateEpic && <Form className="user-story-new-epic" onSubmit={(event) => {event.preventDefault(); handleCreateEpic();}}>
            <Form.Group controlId="new-epic-title">
              <Form.Label>Epic name</Form.Label>
              <Form.Control autoFocus value={epicTitle} disabled={isLoading} placeholder="e.g. Question discovery & organisation"
                onChange={(event) => setEpicTitle(event.target.value)}/>
              <Form.Text>Adds a functional goal directly under the central model node.</Form.Text>
            </Form.Group>
            <div className="d-flex gap-2 mt-3">
              <Button type="submit" disabled={isLoading || !epicTitle.trim() || modelTree[0]?.type !== "Do"}>Create epic</Button>
              <Button variant="outline-secondary" onClick={() => {setShowCreateEpic(false); setEpicTitle("");}}>Cancel</Button>
            </div>
          </Form>}
          {showCreateCard && (
            <CreateUserStoryCard
              treeData={modelTree}
              initialEpicInstanceId={createInEpic}
              disabled={isLoading}
              onCancel={() => setShowCreateCard(false)}
              onCreate={handleCreateStory}
            />
          )}
          {groups.map(({epic, stories}) => {
            const groupId = epic?.instanceId ?? "unlinked";
            const collapsed = collapsedEpics.has(groupId);
            const approved = stories.filter((story) => story.status === "approved").length;
            return (
              <section key={groupId} className="user-story-epic" aria-label={epic?.title ?? "Unlinked stories"}>
                <div className="user-story-epic-header">
                  <button type="button" className="user-story-epic-toggle" aria-expanded={!collapsed}
                    aria-controls={`epic-body-${groupId}`} onClick={() => toggleEpic(groupId)}>
                    {collapsed ? <BsChevronRight aria-hidden="true"/> : <BsChevronDown aria-hidden="true"/>}
                    {epic && <span className="user-story-epic-label">EPIC</span>}
                    <strong>{epic?.title ?? "Unlinked stories"}</strong>
                    <span className="user-story-epic-count text-muted">({stories.length})</span>
                  </button>
                  <span className={`user-story-epic-approved${approved > 0 ? " user-story-epic-approved--active" : ""}`}>
                    {approved}/{stories.length} approved
                  </span>
                  {epic && <Button variant="link" className="user-story-add-in-epic" disabled={isLoading || showCreateCard}
                    aria-label={`Add story to ${epic.title}`} onClick={() => startCreateStory(epic.instanceId)}>
                    <BsPlusLg aria-hidden="true"/> Add story
                  </Button>}
                </div>
                <div id={`epic-body-${groupId}`} className="user-story-epic-body" hidden={collapsed}>
                  {!epic && <p className="text-muted small px-3 pt-3 mb-0">These stories no longer link to a leaf in the current model. Regenerate stories to match the updated hierarchy.</p>}
                  {stories.length ? stories.map(renderStory) : <p className="user-story-epic-empty">No user stories yet. Add a story or generate stories from the model.</p>}
                </div>
              </section>
            );
          })}
          {groups.length === 0 && <p className="text-muted">Add an epic under the central model node to organise your user stories.</p>}
        </div>
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
                      <th style={{width: "4rem"}} className="text-center align-middle">Result</th>
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
                  Add or generate user stories to see the consistency check.
                </span>
              )}
            </Card.Body>
          </Card>
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
