import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

import ErrorModal, {ErrorModalProps} from "./ErrorModal";
import {useFileContext} from "./context/FileProvider";
import {reset} from "./context/treeDataSlice";
import {convertTabContentToInitialTab} from "./utils/modelImport";
import {decodeSharedModelHash} from "./utils/shareModel";

const SharedModelLoader = () => {
    const {dispatch} = useFileContext();
    const navigate = useNavigate();
    const [errorModal, setErrorModal] = useState<ErrorModalProps>({
        show: false,
        title: "",
        message: "",
        onHide: () => setErrorModal((current) => ({...current, show: false})),
    });

    useEffect(() => {
        const loadSharedModel = () => {
            if (!window.location.hash.startsWith("#share=")) return;

            try {
                const model = decodeSharedModelHash(window.location.hash);
                if (!model) return;
                dispatch(reset({
                    tabData: convertTabContentToInitialTab(model.tabData, model.treeData),
                    treeData: model.treeData,
                }));
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
                navigate("/projectEdit", {replace: true});
            } catch (error) {
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
                setErrorModal({
                    show: true,
                    title: "Cannot Open Shared Model",
                    message: error instanceof Error ? error.message : "The shared model link is invalid.",
                    onHide: () => setErrorModal((current) => ({...current, show: false})),
                });
            }
        };

        loadSharedModel();
        window.addEventListener("hashchange", loadSharedModel);
        return () => window.removeEventListener("hashchange", loadSharedModel);
    }, [dispatch, navigate]);

    return <ErrorModal {...errorModal}/>;
};

export default SharedModelLoader;
