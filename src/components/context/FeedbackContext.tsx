import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import type {Feedback, FeedbackReply, FeedbackStatus, OverallFeedback} from "../types";
import {FEEDBACK_MAX_LENGTH} from "../utils/feedbackLimits";
import {useProfileContext} from "./ProfileContext";
import {useProjectContext} from "./ProjectContext";

const STORAGE_KEY = "ammber/feedback";

type FeedbackData = {feedbacks: Feedback[]; overallFeedback?: OverallFeedback};
type FeedbackContextType = FeedbackData & {
    selectedNodeId: string | null;
    selectedNodeLabel: string | null;
    setSelectedNode: (id: string | null, label?: string | null) => void;
    setOverallFeedback: (content: string) => void;
    addFeedback: (nodeId: string, content: string, nodeLabel?: string, author?: string) => void;
    updateFeedbackStatus: (id: string, status: FeedbackStatus) => void;
    deleteFeedback: (id: string) => void;
    addReply: (id: string, content: string) => void;
    resetFeedbacks: (feedbacks?: Feedback[], overallFeedback?: OverallFeedback) => void;
};

const FeedbackContext = createContext<FeedbackContextType | null>(null);

const readFeedback = (): FeedbackData => {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        return value && Array.isArray(value.feedbacks) ? value : {feedbacks: []};
    } catch {
        return {feedbacks: []};
    }
};

export const FeedbackProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const {authorName} = useProfileContext();
    const {currentProject, saveProjectData} = useProjectContext();
    const [data, setData] = useState<FeedbackData>(() => currentProject
        ? {feedbacks: currentProject.feedbacks ?? [], overallFeedback: currentProject.overallFeedback}
        : readFeedback());
    const mounted = useRef(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null);
    const previousAuthor = useRef(authorName);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        if (currentProject) saveProjectData(currentProject.id, data);
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data, currentProject?.id, saveProjectData]);

    useEffect(() => {
        if (previousAuthor.current === authorName) return;
        const oldAuthor = previousAuthor.current;
        previousAuthor.current = authorName;
        if (!oldAuthor.trim() || !authorName.trim()) return;
        setData((current) => ({
            feedbacks: current.feedbacks.map((feedback) => ({
                ...feedback,
                author: feedback.author === oldAuthor ? authorName : feedback.author,
                replies: feedback.replies?.map((reply) => ({...reply, author: reply.author === oldAuthor ? authorName : reply.author})),
            })),
            overallFeedback: current.overallFeedback?.author === oldAuthor
                ? {...current.overallFeedback, author: authorName}
                : current.overallFeedback,
        }));
    }, [authorName]);

    const setSelectedNode = (id: string | null, label?: string | null) => {
        setSelectedNodeId(id);
        setSelectedNodeLabel(id ? label ?? id : null);
    };
    const setOverallFeedback = (content: string) => {
        if (content.length > FEEDBACK_MAX_LENGTH) return;
        const trimmed = content.trim();
        setData((current) => ({...current, overallFeedback: trimmed ? {
            author: current.overallFeedback?.author || authorName.trim() || "Current User",
            content: trimmed,
            updatedAt: new Date().toISOString(),
        } : undefined}));
    };
    const addFeedback = (nodeId: string, content: string, nodeLabel?: string, author?: string) => {
        if (!content.trim() || content.length > FEEDBACK_MAX_LENGTH) return;
        const feedback: Feedback = {
            id: `feedback-${crypto.randomUUID()}`, nodeId, nodeLabel,
            author: (author ?? authorName).trim() || "Current User",
            content: content.trim(), createdAt: "Just now", status: "open", replyCount: 0,
        };
        setData((current) => ({...current, feedbacks: [feedback, ...current.feedbacks]}));
    };
    const updateFeedbackStatus = (id: string, status: FeedbackStatus) => setData((current) => ({
        ...current, feedbacks: current.feedbacks.map((item) => item.id === id ? {...item, status} : item),
    }));
    const deleteFeedback = (id: string) => setData((current) => ({
        ...current, feedbacks: current.feedbacks.filter((item) => item.id !== id),
    }));
    const addReply = (id: string, content: string) => {
        if (!content.trim() || content.length > FEEDBACK_MAX_LENGTH) return;
        const reply: FeedbackReply = {id: `reply-${crypto.randomUUID()}`, author: authorName.trim() || "Current User", content: content.trim(), createdAt: "Just now"};
        setData((current) => ({...current, feedbacks: current.feedbacks.map((item) => item.id === id
            ? {...item, replies: [...(item.replies ?? []), reply], replyCount: (item.replies?.length ?? 0) + 1}
            : item)}));
    };
    const resetFeedbacks = (feedbacks: Feedback[] = [], overallFeedback?: OverallFeedback) => {
        setData({feedbacks, overallFeedback});
        setSelectedNode(null);
    };

    return <FeedbackContext.Provider value={{...data, selectedNodeId, selectedNodeLabel, setSelectedNode,
        setOverallFeedback, addFeedback, updateFeedbackStatus, deleteFeedback, addReply, resetFeedbacks}}>
        {children}
    </FeedbackContext.Provider>;
};

export const useFeedbackContext = () => {
    const context = useContext(FeedbackContext);
    if (!context) throw new Error("useFeedbackContext must be used inside FeedbackProvider");
    return context;
};
