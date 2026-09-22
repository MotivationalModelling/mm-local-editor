import {useState} from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import {BsStars} from "react-icons/bs";

import ProjectBackgroundModal from "../ProjectBackgroundModal";
import {useFileContext} from "../context/FileProvider";
import {useUserStories} from "../context/UserStoriesContext";
import {generateValidatedUserStories} from "../utils/userStoryGeneration";
import {extractModelForPrompt} from "../utils/modelExtractor";

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
            dispatch({type: "SET_LOADING"});
            const result = await generateValidatedUserStories(extracted, background);
            dispatch({type: "SET_SUCCESS", payload: result});
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
                variant="outline-warning"
                className="user-stories-generation"
                disabled={isGenerating}
                onClick={() => setShowBackgroundModal(true)}
            >
                {isGenerating ? (
                    <>
                        <Spinner animation="border" size="sm"/>
                        Generating...
                    </>
                ) : (
                    <>
                        <BsStars aria-hidden="true"/>
                        Generate User Stories
                    </>
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
