import {Feedback, OverallFeedback} from "../components/types.ts";

// Sample feedback shown alongside the default example graph (see
// defaultTreeData / createDefaultTabData in initialTabs.ts), so that
// "Reset > Default" restores a fully worked example -- goals *and* the
// feedback that goes with them -- rather than leaving old feedback behind
// or dropping the user into a graph with no feedback at all.
export const defaultFeedbacks: Feedback[] = [{
    id: "default-feedback-1",
    nodeId: "Functional-6:1",
    nodeLabel: "Do1",
    author: "Ammber Team",
    content: "This goal could use a bit more detail on how it will be achieved.",
    createdAt: "Just now",
    status: "open",
    replyCount: 0
}, {
    id: "default-feedback-2",
    nodeId: "Functional-8:1",
    nodeLabel: "Do3",
    author: "Ammber Team",
    content: "Nice and specific -- this is a good example of a well scoped goal.",
    createdAt: "Just now",
    status: "resolved",
    replyCount: 0
}];

// Overall (model-wide) feedback that goes with the example graph, on
// branches where that feature exists.
export const defaultOverallFeedback: OverallFeedback = {
    author: "Ammber Team",
    content: "Overall this is a solid starting structure -- try filling in the remaining Be/Feel/Concern/Who goals next.",
    // Example feedback has no real update date.
    updatedAt: ""
};
