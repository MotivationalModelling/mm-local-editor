import {useEffect, useMemo, useState} from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import {QRCodeSVG} from "qrcode.react";
import "./ShareModal.css";

import {useFileContext} from "./context/FileProvider";
import {useFeedbackContext} from "./context/FeedbackContext";
import ExportFileButton from "./header/ExportFileButton";
import {createShareUrl, getShareUrlByteLength, MAX_QR_URL_BYTES} from "./utils/shareModel";
import type {Project} from "./utils/projects";
import {downloadProjectImage, projectToModelJson} from "./utils/projectImage";

type ShareModalProps = {
    show: boolean;
    showGraphSection: boolean;
    onHide: () => void;
    project?: Project;
};

const ShareModal = ({show, showGraphSection, onHide, project}: ShareModalProps) => {
    const {tabData, treeData} = useFileContext();
    const {feedbacks, overallFeedback} = useFeedbackContext();
    const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
    const [includeNodeFeedback, setIncludeNodeFeedback] = useState(true);
    const [exportError, setExportError] = useState<string | null>(null);
    const model = useMemo(() => project ? projectToModelJson(project) : {tabData, treeData, feedbacks, overallFeedback},
    [project, tabData, treeData, feedbacks, overallFeedback]);
    const shareUrl = useMemo(() => createShareUrl(model), [model]);
    const goalFeedbacks = model.feedbacks ?? [];
    const tooLarge = getShareUrlByteLength(shareUrl) > MAX_QR_URL_BYTES;
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    useEffect(() => {
        if (copyStatus !== "copied") return;
        const timeout = window.setTimeout(() => setCopyStatus("idle"), 2000);
        return () => window.clearTimeout(timeout);
    }, [copyStatus]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyStatus("copied");
        } catch {
            setCopyStatus("error");
        }
    };
    const exportImage = async (format: "png" | "svg") => {
        try {
            setExportError(null);
            await downloadProjectImage(model, format, includeNodeFeedback, project?.name ?? "Graph");
        } catch (error) {
            setExportError(error instanceof Error ? error.message : "The image could not be exported.");
        }
    };

    return (
        <Modal show={show} onHide={() => {setCopyStatus("idle"); onHide();}} centered dialogClassName="share-dialog">
            <Modal.Header closeButton>
                <Modal.Title>Share</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Anyone with the link can open a copy of this model.</p>
                {tooLarge ? (
                    <p role="alert">This model is too large for a share link. Export it as an image instead.</p>
                ) : (
                    <>
                        <div className="d-flex gap-2 mb-3">
                            <Form.Control
                                aria-label="Share link"
                                value={shareUrl}
                                readOnly
                                style={{minWidth: 0}}
                                onFocus={(event) => event.currentTarget.select()}
                            />
                            <Button variant="outline-primary" className="text-nowrap flex-shrink-0" onClick={copyLink}>
                                {copyStatus === "copied" ? "Copied" : "Copy link"}
                            </Button>
                        </div>
                        {copyStatus === "error" && (
                            <p role="alert">Could not copy automatically. Select the link and copy it manually.</p>
                        )}
                        <div className="text-center">
                            <QRCodeSVG value={shareUrl} size={168} level="L" marginSize={2} data-testid="share-qr"/>
                        </div>
                        {isLocalhost && (
                            <p className="text-muted mt-3 mb-0">
                                This localhost link can only be opened on this computer.
                            </p>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
                <div>
                    <div>Export the model as an image</div>
                    <Form.Check type="switch" label="Include goal feedback" checked={includeNodeFeedback && goalFeedbacks.length > 0}
                                disabled={goalFeedbacks.length === 0} onChange={(event) => setIncludeNodeFeedback(event.target.checked)}/>
                    {exportError && <div role="alert" className="text-danger small">{exportError}</div>}
                </div>
                {project ? <DropdownButton title="Export" variant="outline-primary" align="end">
                    <Dropdown.Item onClick={() => void exportImage("png")}>Export as PNG</Dropdown.Item>
                    <Dropdown.Item onClick={() => void exportImage("svg")}>Export as SVG</Dropdown.Item>
                </DropdownButton> : <ExportFileButton showGraphSection={showGraphSection} includeNodeFeedback={includeNodeFeedback}/>}
            </Modal.Footer>
        </Modal>
    );
};

export default ShareModal;
