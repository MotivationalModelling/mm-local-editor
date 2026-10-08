import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import FeedbackItem from "./FeedbackItem";
import FeedbackAuthor from "./FeedbackAuthor";

import {useFeedbackContext} from "../context/FeedbackContext";
import {useProfileContext} from "../context/ProfileContext";

import {FEEDBACK_MAX_LENGTH} from "../utils/feedbackLimits";

import "./FeedbackPanel.css";

type FeedbackFilter =
    | "all"
    | "open"
    | "resolved";

interface FeedbackPanelProps {
    /**
     * Called when the user closes the feedback panel.
     */
    onClose: () => void;

    /**
     * Called when the user clicks a feedback card, to locate its node
     * on the graph canvas.
     */
    onSelectNode?: (nodeId: string) => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
    onClose,
    onSelectNode
}) => {
    const {
        feedbacks,
        overallFeedback,
        setOverallFeedback,
        selectedNodeId,
        selectedNodeLabel,
        addFeedback,
        updateFeedbackStatus,
        deleteFeedback,
        addReply
    } = useFeedbackContext();

    const {
        authorName,
        updateProfile
    } = useProfileContext();

    const [activeFilter, setActiveFilter] =
        useState<FeedbackFilter>("all");

    const [isComposerOpen, setIsComposerOpen] =
        useState(false);

    const [newFeedback, setNewFeedback] =
        useState("");

    const [overallDraft, setOverallDraft] =
        useState(overallFeedback?.content ?? "");

    // Keep the draft in sync when switching projects or external edits.
    useEffect(() => {
        setOverallDraft(overallFeedback?.content ?? "");
    }, [overallFeedback]);

    const overallDirty =
        overallDraft.trim() !==
        (overallFeedback?.content ?? "").trim();

    const [showAuthorPrompt, setShowAuthorPrompt] =
        useState(false);

    const [authorNameInput, setAuthorNameInput] =
        useState("");

    /**
     * Feedback shown in the list. When a graph node is selected only that
     * node's feedback is shown; otherwise all feedback across the model is
     * listed so nothing stays hidden until its node happens to be clicked.
     */
    const visibleFeedbacks = useMemo(() => {
        if (!selectedNodeId) {
            return feedbacks;
        }

        return feedbacks.filter(
            (feedback) =>
                feedback.nodeId === selectedNodeId
        );
    }, [feedbacks, selectedNodeId]);

    const openCount = useMemo(
        () =>
            visibleFeedbacks.filter(
                (feedback) =>
                    feedback.status === "open"
            ).length,
        [visibleFeedbacks]
    );

    const resolvedCount = useMemo(
        () =>
            visibleFeedbacks.filter(
                (feedback) =>
                    feedback.status === "resolved"
            ).length,
        [visibleFeedbacks]
    );

    const filteredFeedbacks = useMemo(() => {
        switch (activeFilter) {
            case "open":
                return visibleFeedbacks.filter(
                    (feedback) =>
                        feedback.status === "open"
                );

            case "resolved":
                return visibleFeedbacks.filter(
                    (feedback) =>
                        feedback.status === "resolved"
                );

            case "all":
            default:
                return visibleFeedbacks;
        }
    }, [activeFilter, visibleFeedbacks]);

    /**
     * Adds the pending feedback under the given author name, then resets the
     * composer. Extracted so the author-name prompt can submit on save too.
     */
    const submitFeedback = (
        author: string,
        content: string
    ) => {
        if (!selectedNodeId || content.length > FEEDBACK_MAX_LENGTH) {
            return;
        }

        addFeedback(
            selectedNodeId,
            content,
            selectedNodeLabel ?? undefined,
            author
        );

        setNewFeedback("");
        setIsComposerOpen(false);

        /**
         * Newly-created feedback is normally unresolved,
         * so switch back to All to ensure that the user sees it.
         */
        setActiveFilter("all");
    };

    const handleSubmitFeedback = () => {
        const content = newFeedback.trim();

        if (
            !selectedNodeId ||
            !content || newFeedback.length > FEEDBACK_MAX_LENGTH
        ) {
            return;
        }

        if (!authorName.trim()) {
            setAuthorNameInput("");
            setShowAuthorPrompt(true);
            return;
        }

        submitFeedback(authorName, content);
    };

    const handleAuthorSave = () => {
        const name = authorNameInput.trim();

        if (!name) {
            return;
        }

        updateProfile(name);
        setShowAuthorPrompt(false);

        const content = newFeedback.trim();

        if (selectedNodeId && content) {
            submitFeedback(name, content);
        }
    };

    const handleAuthorCancel = () => {
        setShowAuthorPrompt(false);
        setAuthorNameInput("");
    };

    useEffect(() => {
        if (!showAuthorPrompt) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowAuthorPrompt(false);
                setAuthorNameInput("");
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
    }, [showAuthorPrompt]);

    const handleCancelComposer = () => {
        setNewFeedback("");
        setIsComposerOpen(false);
    };

    const handleSaveOverall = () => {
        if (!overallDirty || overallDraft.length > FEEDBACK_MAX_LENGTH) {
            return;
        }

        setOverallFeedback(overallDraft);
    };

    const handleCancelOverall = () => {
        setOverallDraft(overallFeedback?.content ?? "");
    };

    return (
        <aside className="feedback-panel">
            <header className="feedback-panel-header">
                <div>
                    <span className="feedback-panel-eyebrow">
                        Review
                    </span>

                    <h2>Feedback</h2>
                </div>

                <button
                    type="button"
                    className="feedback-close-button"
                    onClick={onClose}
                    aria-label="Close feedback panel"
                >
                    ×
                </button>
            </header>

            <FeedbackAuthor />

            <section className="feedback-overall">
                <div className="feedback-overall-head">
                    <span className="feedback-overall-label">
                        Overall Feedback
                    </span>
                </div>

                <textarea
                    id="feedback-overall-content"
                    className="feedback-overall-textarea"
                    maxLength={FEEDBACK_MAX_LENGTH}
                    aria-describedby="feedback-overall-count"
                    value={overallDraft}
                    onChange={(event) =>
                        setOverallDraft(event.target.value)
                    }
                    placeholder="Feedback about the model as a whole..."
                    rows={3}
                />

                <div id="feedback-overall-count" className="feedback-character-count">
                    {overallDraft.length}/{FEEDBACK_MAX_LENGTH} characters
                </div>

                {overallDirty && (
                    <div className="feedback-overall-actions">
                        <button
                            type="button"
                            className="feedback-overall-cancel"
                            onClick={handleCancelOverall}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="feedback-overall-save"
                            onClick={handleSaveOverall}
                            disabled={overallDraft.length > FEEDBACK_MAX_LENGTH || (!overallDraft.trim() && !overallFeedback?.content)}
                        >
                            Save
                        </button>
                    </div>
                )}

                {!overallDirty && overallFeedback && (
                    <div className="feedback-overall-meta">
                        Saved by {overallFeedback.author}
                        {overallFeedback.updatedAt &&
                            ` · ${new Date(
                                overallFeedback.updatedAt
                            ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric"
                            })}`}
                    </div>
                )}
            </section>

            {selectedNodeId ? (
                <section className="feedback-node-context">
                    <span className="feedback-node-label">
                        Attached to
                    </span>

                    <span
                        className="feedback-node-name"
                        title={
                            selectedNodeLabel ??
                            selectedNodeId
                        }
                    >
                        {selectedNodeLabel ??
                            selectedNodeId}
                    </span>

                    {!isComposerOpen && (
                        <button
                            type="button"
                            className="feedback-new-button"
                            onClick={() =>
                                setIsComposerOpen(true)
                            }
                        >
                            + New Feedback
                        </button>
                    )}
                </section>
            ) : (
                <div className="feedback-all-context">
                    <span className="feedback-all-title">
                        All feedback
                    </span>

                    <span className="feedback-all-hint">
                        Click a card to locate its node
                    </span>
                </div>
            )}

            {isComposerOpen && selectedNodeId && (
                <section className="feedback-composer">
                    <label
                        htmlFor="feedback-new-content"
                        className="feedback-composer-label"
                    >
                        New Feedback
                    </label>

                    <textarea
                        id="feedback-new-content"
                        className="feedback-composer-textarea"
                        maxLength={FEEDBACK_MAX_LENGTH}
                        aria-describedby="feedback-new-count"
                        value={newFeedback}
                        onChange={(event) =>
                            setNewFeedback(
                                event.target.value
                            )
                        }
                        placeholder={`Add feedback about ${
                            selectedNodeLabel ??
                            selectedNodeId
                        }...`}
                        rows={4}
                        autoFocus
                    />

                    <div id="feedback-new-count" className="feedback-character-count">
                        {newFeedback.length}/{FEEDBACK_MAX_LENGTH} characters
                    </div>

                    <div className="feedback-composer-actions">
                        <button
                            type="button"
                            className="feedback-cancel-button"
                            onClick={
                                handleCancelComposer
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="feedback-submit-button"
                            onClick={
                                handleSubmitFeedback
                            }
                            disabled={
                                !newFeedback.trim() || newFeedback.length > FEEDBACK_MAX_LENGTH
                            }
                        >
                            Add Feedback
                        </button>
                    </div>
                </section>
            )}

            <nav
                className="feedback-filter-tabs"
                aria-label="Feedback filters"
            >
                <button
                    type="button"
                    className={
                        activeFilter === "all"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveFilter("all")
                    }
                >
                    All
                    <span>
                        {visibleFeedbacks.length}
                    </span>
                </button>

                <button
                    type="button"
                    className={
                        activeFilter === "open"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveFilter("open")
                    }
                >
                    Unresolved
                    <span>{openCount}</span>
                </button>

                <button
                    type="button"
                    className={
                        activeFilter === "resolved"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveFilter(
                            "resolved"
                        )
                    }
                >
                    Resolved
                    <span>{resolvedCount}</span>
                </button>
            </nav>

            <div className="feedback-list">
                {filteredFeedbacks.length > 0 ? (
                    filteredFeedbacks.map(
                        (feedback) => (
                            <FeedbackItem
                                key={feedback.id}
                                feedback={feedback}
                                onStatusChange={updateFeedbackStatus}
                                onReply={addReply}
                                onDelete={deleteFeedback}
                                onSelectNode={onSelectNode}
                            />
                        )
                    )
                ) : (
                    <div className="feedback-empty-list">
                        <strong>
                            {activeFilter === "all"
                                ? "No feedback yet"
                                : activeFilter ===
                                  "open"
                                ? "No unresolved feedback"
                                : "No resolved feedback"}
                        </strong>

                        <p>
                            {activeFilter === "all"
                                ? "Add the first feedback item for this node."
                                : "Try another feedback filter."}
                        </p>
                    </div>
                )}
            </div>

            {showAuthorPrompt && (
                <div
                    className="feedback-modal-overlay"
                    onClick={handleAuthorCancel}
                >
                    <div
                        className="feedback-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feedback-author-title"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <header className="feedback-modal-header">
                            <div>
                                <span className="feedback-modal-eyebrow">
                                    About you
                                </span>

                                <h3
                                    id="feedback-author-title"
                                    className="feedback-modal-title"
                                >
                                    Set your name
                                </h3>
                            </div>

                            <button
                                type="button"
                                className="feedback-modal-close"
                                onClick={handleAuthorCancel}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </header>

                        <p className="feedback-modal-copy">
                            How should we address you in
                            feedback?
                        </p>

                        <input
                            className="feedback-modal-input"
                            value={authorNameInput}
                            onChange={(event) =>
                                setAuthorNameInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleAuthorSave();
                                }
                            }}
                            placeholder="Your name"
                            autoFocus
                        />

                        <footer className="feedback-modal-actions">
                            <button
                                type="button"
                                className="feedback-modal-cancel"
                                onClick={handleAuthorCancel}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="feedback-modal-save"
                                onClick={handleAuthorSave}
                                disabled={!authorNameInput.trim()}
                            >
                                Save
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default FeedbackPanel;