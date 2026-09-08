import {useLayoutEffect, useRef, useState} from "react";
import {flushSync} from "react-dom";
import Button from "react-bootstrap/Button";
import {useFileContext} from "../context/FileProvider";
import ErrorModal, {ErrorModalProps} from "../ErrorModal";
import {returnFocusToGraph} from "../utils/GraphUtils";
import {createModelJson} from "../modelJson";
import {useGraph} from "../context/GraphContext";
import {captureNonFunctionalLayout} from "../Graphs/GraphGeometryUtils";

const SaveFileButton = () => {
    const {setJsonFileHandle, treeData, tabData, goals, nonFunctionalLayout} = useFileContext();
    const {graph} = useGraph();
    const currentModel = useRef({treeData, tabData, goals, nonFunctionalLayout});
    useLayoutEffect(() => {
        currentModel.current = {treeData, tabData, goals, nonFunctionalLayout};
    }, [treeData, tabData, goals, nonFunctionalLayout]);
    const [errorModal, setErrorModal] = useState<ErrorModalProps>({
        show: false,
        title: "Cannot Save Model",
        message: "",
        onHide: () => setErrorModal(previous => ({...previous, show: false})),
    });

    const showSaveError = (message: string) => {
        setErrorModal(previous => ({...previous, show: true, message}));
    };

    const handleSave = async () => {
        try {
            // maxGraph owns the unsaved editor buffer. Commit it through the
            // existing validation handler and flush React's resulting update
            // before reading the model. Only needed when an edit is active.
            if (graph?.isEditing()) {
                flushSync(() => graph.stopEditing(false));
            }
            const snapshot = currentModel.current;
            if (!Object.values(snapshot.goals).some(goal => goal.content.trim() !== "")) {
                showSaveError("No goals have been added. Please add at least one goal before saving.");
                return;
            }
            // Capture current model data and validate it before opening a file.
            const layout = graph ? captureNonFunctionalLayout(graph) : snapshot.nonFunctionalLayout;
            const json = JSON.stringify(createModelJson(snapshot.tabData, snapshot.treeData, snapshot.goals, layout));
            const handle = await window.showSaveFilePicker({
                suggestedName: "Model.json",
                types: [{description: "JSON Files", accept: {"application/json": [".json"]}}],
            });
            const writable = await handle.createWritable();
            try {
                await writable.write(json);
                await writable.close();
            } catch (error) {
                // Discard a failed write rather than commit partial file data.
                await writable.abort().catch(() => undefined);
                throw error;
            }
            setJsonFileHandle(handle);
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                // Cancelling the native file picker is not an application error.
                return;
            } else {
                showSaveError(error instanceof Error ? error.message : "The model could not be saved.");
            }
        } finally {
            returnFocusToGraph();
        }
    };

    return (
        <>
            <Button variant="outline-primary" onClick={handleSave}>Save</Button>
            <ErrorModal {...errorModal}/>
        </>
    );
};

export default SaveFileButton;
