import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import {useFileContext} from "../context/FileProvider";
import {parseStoriesFromText, useUserStories} from "../context/UserStoriesContext";
import {generateUserStories} from "../utils/llmService";
import {extractModelForPrompt} from "../utils/modelExtractor";
import {buildUserStoryPrompt} from "../utils/promptBuilder";

const GenerateUserStoriesButton = () => {
    const {treeData} = useFileContext();
    const {state, dispatch} = useUserStories();
    const isGenerating = state.status === "loading";

    const handleGenerate = async () => {
        try {
            const extracted = extractModelForPrompt(treeData);
            const prompt = buildUserStoryPrompt(extracted);
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
        <Button
            variant="outline-primary"
            disabled={isGenerating}
            onClick={handleGenerate}
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
    );
};

export default GenerateUserStoriesButton;
