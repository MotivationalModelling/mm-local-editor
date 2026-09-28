import React, {useState} from "react";

import type {
    Feedback,
    FeedbackStatus
} from "../types.ts";

import Avatar from "../Avatar";
import {FEEDBACK_MAX_LENGTH} from "../utils/feedbackLimits";
import {useProfileContext} from "../context/ProfileContext";

interface FeedbackItemProps {
    feedback: Feedback;

    onStatusChange?: (
        feedbackId: string,
        newStatus: FeedbackStatus
    ) => void;

    onReply?: (
        feedbackId: string,
        content: string
    ) => void;

    onDelete?: (feedbackId: string) => void;

    /**
     * Called when the card is clicked, to locate the node it is
     * attached to on the graph canvas.
     */
    onSelectNode?: (nodeId: string) => void;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
    feedback,
    onStatusChange,
    onReply,
    onDelete,
    onSelectNode
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const {
        authorName,
        avatarSeed
    } = useProfileContext();

    // Keep the card avatar in sync with the profile header's chosen seed.
    const authorSeed =
        feedback.author === authorName
            ? avatarSeed.trim() || feedback.author
            : feedback.author;

    const [isReplying, setIsReplying] = useState(false);

    const [replyText, setReplyText] = useState("");

    const isResolved = feedback.status === "resolved";

    const nodeLabel = feedback.nodeLabel ?? feedback.nodeId;

    const replies = feedback.replies ?? [];

    const handleCardClick = () => {
        if (!onSelectNode) {
            return;
        }

        onSelectNode(feedback.nodeId);
    };

    const handleStatusClick = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation();

        if (!onStatusChange) {
            return;
        }

        onStatusChange(
            feedback.id,
            isResolved ? "open" : "resolved"
        );
    };

    const handleReplyClick = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation();
        setIsReplying((current) => !current);
    };

    const handleSubmitReply = () => {
        const content = replyText.trim();

        if (!content || replyText.length > FEEDBACK_MAX_LENGTH) {
            return;
        }

        onReply?.(feedback.id, content);
        setReplyText("");
    };

    const handleDelete = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation();
        onDelete?.(feedback.id);
        setShowMenu(false);
    };

    return (
        <article
            className={`feedback-item ${
                isResolved
                    ? "feedback-item-resolved"
                    : ""
            }`}
            onClick={handleCardClick}
            title={
                onSelectNode
                    ? "Click to locate this node"
                    : undefined
            }
        >
            <div
                className="feedback-node-tag"
                title={`On ${nodeLabel}`}
            >
                <span
                    className="feedback-node-tag-dot"
                    aria-hidden="true"
                />

                {nodeLabel}
            </div>

            <header className="feedback-item-header">
                <div className="feedback-author">
                    <Avatar
                        seed={authorSeed}
                        size={28}
                        className="feedback-avatar"
                    />

                    <div className="feedback-author-info">
                        <strong className="feedback-author-name">
                            {feedback.author}
                        </strong>

                        <span className="feedback-time">
                            {feedback.createdAt}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className={`feedback-status-button ${
                        isResolved
                            ? "feedback-status-resolved"
                            : "feedback-status-open"
                    }`}
                    onClick={handleStatusClick}
                    aria-label={
                        isResolved
                            ? "Mark feedback as unresolved"
                            : "Mark feedback as resolved"
                    }
                >
                    {isResolved
                        ? "Resolved"
                        : "Unresolved"}
                </button>
            </header>

            <p className="feedback-content">
                {feedback.content}
            </p>

            <footer className="feedback-item-footer">
                <button
                    type="button"
                    className="feedback-text-button"
                    onClick={handleReplyClick}
                    aria-expanded={isReplying}
                >
                    {isReplying ? "Close" : "Reply"}

                    {(feedback.replyCount ?? 0) >
                        0 && (
                        <span className="feedback-reply-count">
                            (
                            {
                                feedback.replyCount
                            }
                            )
                        </span>
                    )}
                </button>

                <div className="feedback-more-wrapper">
                    <button
                        type="button"
                        className="feedback-more-button"
                        aria-label="More feedback actions"
                        title="More actions"
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowMenu(
                                (current) =>
                                    !current
                            );
                        }}
                    >
                        •••
                    </button>

                    {showMenu && (
                        <div className="feedback-action-menu">
                            <button
                                type="button"
                                className="feedback-delete-action"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </footer>

            <div
                className={`feedback-reply-panel ${
                    isReplying ? "is-open" : ""
                }`}
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="feedback-reply-panel-inner">
                    {replies.length > 0 && (
                        <ul className="feedback-reply-list">
                            {replies.map((reply) => (
                                <li
                                    key={reply.id}
                                    className="feedback-reply"
                                >
                                    <strong
                                        className="feedback-reply-author"
                                    >
                                        {reply.author}
                                    </strong>

                                    <p
                                        className="feedback-reply-content"
                                    >
                                        {reply.content}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="feedback-reply-composer">
                        <input
                            className="feedback-reply-input"
                            maxLength={FEEDBACK_MAX_LENGTH}
                            aria-describedby={`feedback-reply-count-${feedback.id}`}
                            value={replyText}
                            onChange={(event) =>
                                setReplyText(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleSubmitReply();
                                }
                            }}
                            placeholder="Write a reply..."
                        />

                        <button
                            type="button"
                            className="feedback-reply-submit"
                            onClick={handleSubmitReply}
                            disabled={!replyText.trim() || replyText.length > FEEDBACK_MAX_LENGTH}
                        >
                            Send
                        </button>
                    </div>
                    <div id={`feedback-reply-count-${feedback.id}`} className="feedback-character-count">
                        {replyText.length}/{FEEDBACK_MAX_LENGTH} characters
                    </div>
                </div>
            </div>
        </article>
    );
};

export default FeedbackItem;
