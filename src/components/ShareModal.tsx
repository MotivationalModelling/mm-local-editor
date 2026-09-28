import {useEffect, useMemo, useState} from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import {QRCodeSVG} from "qrcode.react";
import "./ShareModal.css";

import {useFileContext} from "./context/FileProvider";
import ExportFileButton from "./header/ExportFileButton";
import {createShareUrl, getShareUrlByteLength, MAX_QR_URL_BYTES} from "./utils/shareModel";

type ShareModalProps = {
    show: boolean;
    showGraphSection: boolean;
    onHide: () => void;
};

const ShareModal = ({show, showGraphSection, onHide}: ShareModalProps) => {
    const {tabData, treeData} = useFileContext();
    const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
    const shareUrl = useMemo(() => createShareUrl({tabData, treeData}), [tabData, treeData]);
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
                <span>Export the model as an image</span>
                <ExportFileButton showGraphSection={showGraphSection}/>
            </Modal.Footer>
        </Modal>
    );
};

export default ShareModal;
