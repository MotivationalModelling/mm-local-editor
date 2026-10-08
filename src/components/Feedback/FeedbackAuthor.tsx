import React, {useEffect, useState} from "react";
import Avatar from "../Avatar";
import {useProfileContext} from "../context/ProfileContext";
import "./FeedbackAuthor.css";

const randomSeed = () => Math.random().toString(36).slice(2, 10);

const FeedbackAuthor: React.FC = () => {
    const {authorName, avatarSeed, updateProfile, updateAvatarSeed} =
        useProfileContext();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(authorName);
    const [seed, setSeed] = useState(avatarSeed);

    const start = () => {
        setName(authorName);
        setSeed(avatarSeed || authorName);
        setEditing(true);
    };

    const save = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        updateProfile(trimmed);
        updateAvatarSeed(seed.trim());
        setEditing(false);
    };

    useEffect(() => {
        if (!editing) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setEditing(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [editing]);

    return (
        <section className="feedback-author-profile">
            {editing ? (
                <form
                    className="feedback-author-editor"
                    onSubmit={(event) => {
                        event.preventDefault();
                        save();
                    }}
                >
                    <span className="feedback-author-avatar-pick">
                        <Avatar
                            seed={seed.trim() || name}
                            size={40}
                            className="feedback-author-avatar"
                        />
                        <button
                            type="button"
                            className="feedback-author-shuffle"
                            onClick={() => setSeed(randomSeed())}
                            aria-label="Change avatar"
                            title="Change avatar"
                        >
                            ↻
                        </button>
                    </span>

                    <label className="feedback-author-fields">
                        <span className="feedback-author-field-label">
                            Name
                        </span>
                        <input
                            className="feedback-author-name-input"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Your name"
                            autoFocus
                        />
                    </label>

                    <div className="feedback-author-actions">
                        <button
                            type="button"
                            className="feedback-author-cancel"
                            onClick={() => setEditing(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="feedback-author-save"
                            disabled={!name.trim()}
                        >
                            Save
                        </button>
                    </div>
                </form>
            ) : (
                <div className="feedback-author-view">
                    <Avatar
                        seed={avatarSeed || authorName}
                        size={34}
                        className="feedback-author-avatar"
                    />
                    <span className="feedback-author-display-name">
                        {authorName.trim() || "Set name"}
                    </span>
                    <button
                        type="button"
                        className="feedback-author-edit-button"
                        onClick={start}
                        aria-label="Edit name and avatar"
                        title="Edit name and avatar"
                    >
                        ✎
                    </button>
                </div>
            )}
        </section>
    );
};

export default FeedbackAuthor;
