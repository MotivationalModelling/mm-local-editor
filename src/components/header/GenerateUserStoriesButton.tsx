import {useState} from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import ProjectBackgroundModal from "../ProjectBackgroundModal";
import {useFileContext} from "../context/FileProvider";
import {parseStoriesFromText, useUserStories} from "../context/UserStoriesContext";
import {generateUserStories} from "../utils/llmService";
import {extractModelForPrompt} from "../utils/modelExtractor";
import {buildUserStoryPrompt} from "../utils/promptBuilder";

const GenerateUserStoriesButton = () => {
    const {treeData} = useFileContext();
    const {state, dispatch} = useUserStories();
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [projectBackground, setProjectBackground] = useState("");
    const isGenerating = state.status === "loading";

    const handleGenerate = async (background: string) => {
        setShowBackgroundModal(false);
        try {
            const extracted = extractModelForPrompt(treeData);
            const prompt = buildUserStoryPrompt(extracted, background);
            dispatch({type: "SET_LOADING"});
            const raw = await generateUserStories(prompt);
            const stories = parseStoriesFromText(raw);
            dispatch({type: "SET_SUCCESS", payload: {rawOutput: raw, stories}});
        } catch (error) {
            dispatch({
                type: "SET_ERROR",
                payload: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    return (
        <>
            <Button
                variant="outline-primary"
                disabled={isGenerating}
                onClick={() => setShowBackgroundModal(true)}
            >
                {isGenerating ? (
                    <>
                        <Spinner animation="border" size="sm" className="me-1"/>
                        Generating...
                    </>
                ) : (
                    "✨ Generate User Stories"
                )}
            </Button>
            <ProjectBackgroundModal
                show={showBackgroundModal}
                projectBackground={projectBackground}
                onProjectBackgroundChange={setProjectBackground}
                onCancel={() => setShowBackgroundModal(false)}
                onConfirm={handleGenerate}
            />
        </>
    );
};

export default GenerateUserStoriesButton;
