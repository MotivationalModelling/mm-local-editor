import { Button } from "react-bootstrap";
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import FileDrop from "./FileDrop";
import FileUploadSection from "./FileUploadSection";
import ErrorModal from "./ErrorModal";

const EMPTY_FILE_ALERT = "Please select a file";
const XML_FILE_ALERT = "Please select an XML file";
const JSON_FILE_ALERT = "Please select a JSON file.";

type WelcomeButtonsProps = {
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
};

type ModalState = {
  show: boolean;
  title: string;
  message: string;
  onHide: () => void;
};

const defaultModalState: ModalState = {
  show: false,
  title: "",
  message: "",
  onHide: () => {},
};

const WelcomeButtons = ({ isDragging, setIsDragging }: WelcomeButtonsProps) => {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isXmlDragOver, setIsXmlDragOver] = useState(false);
  const [isJsonDragOver, setIsJsonDragOver] = useState(false);
  const [errorModal, setErrorModal] = useState<ModalState>(defaultModalState);

  const xmlFileRef = useRef<HTMLInputElement>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);

  // Handle File drag and drop
  const hanldeXMLFileDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const dropFiles = evt.dataTransfer.files;
    handleXMLFileInputChange(dropFiles?.[0]);
  };

  const hanldeJSONFileDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const dropFiles = evt.dataTransfer.files;
    handleJSONFileInputChange(dropFiles?.[0]);
  };

  const handleXMLFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsXmlDragOver(true);
  };

  const handleJSONFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsJsonDragOver(true);
  };

  const handleFileDragLeave = () => {
    setIsXmlDragOver(false);
    setIsJsonDragOver(false);
  };

  // Triger file upload event for dropping files
  const handleXMLUpload = () => {
    if (xmlFileRef.current) {
      xmlFileRef.current.value = "";
      xmlFileRef.current.click();
    }
  };

  const handleJSONUpload = () => {
    if (jsonFileRef.current) {
      jsonFileRef.current.value = "";
      jsonFileRef.current.click();
    }
  };

  // Handle files upload and files type checking
  const handleXMLFileInputChange = (file: File | undefined) => {
    if (!file) {
      setIsXmlDragOver(false);
      setErrorModal({
        ...defaultModalState,
        show: true,
        title: "File Upload Failed",
        message: EMPTY_FILE_ALERT,
        onHide: () => setErrorModal(defaultModalState),
      });
      return;
    }

    if (file.type !== "text/xml") {
      setIsXmlDragOver(false);
      setErrorModal({
        ...defaultModalState,
        show: true,
        title: "Incorrect File Type",
        message: XML_FILE_ALERT,
        onHide: () => setErrorModal(defaultModalState),
      });
      return;
    }

    setXmlFile(file);
  };

  /* --------------------------------------------------------------------------------------------------------*/

  const handleJSONFileInputChange = (file: File | undefined) => {
    if (!file) {
      setIsJsonDragOver(false);
      setErrorModal({
        ...defaultModalState,
        show: true,
        title: "File Upload Failed",
        message: EMPTY_FILE_ALERT,
        onHide: () => setErrorModal(defaultModalState),
      });
      return;
    }

    if (file.type !== "application/json") {
      setIsJsonDragOver(false);
      setErrorModal({
        ...defaultModalState,
        show: true,
        title: "Incorrect File Type",
        message: JSON_FILE_ALERT,
        onHide: () => setErrorModal(defaultModalState),
      });
      return;
    }

    setJsonFile(file);
  };

  // Remove uploaded files
  const handleXMLFileRemove = () => {
    setXmlFile(null);
    setIsXmlDragOver(false);
  };

  const handleJSONFileRemove = () => {
    setJsonFile(null);
    setIsJsonDragOver(false);
  };

  /* --------------------------------------------------------------------------------------------------------*/

  return (
    <div
      className="d-flex justify-content-center mt-3"
      style={{ height: "100px" }}
    >
      {/* Error Modal while user upload wrong types or invalid files */}
      <ErrorModal {...errorModal} />

      {/* File Input */}
      <input
        type="file"
        accept=".xml"
        onChange={(e) => handleXMLFileInputChange(e.target.files?.[0])}
        style={{ display: "none" }}
        ref={xmlFileRef}
      />
      <input
        type="file"
        accept=".json"
        multiple
        onChange={(e) => handleJSONFileInputChange(e.target.files?.[0])}
        style={{ display: "none" }}
        ref={jsonFileRef}
      />
      {/* Conditionally render create/open buttons or files section */}
      {isDragging ? (
        <>
          {!xmlFile ? (
            <FileDrop
              onClick={handleXMLUpload}
              onDrop={hanldeXMLFileDrop}
              onDragLeave={handleFileDragLeave}
              onDragOver={handleXMLFileDragOver}
              isDragOver={isXmlDragOver}
              fileType="XML"
            />
          ) : (
            <FileUploadSection
              file={xmlFile}
              onRemove={handleXMLFileRemove}
              onUpload={handleXMLUpload}
            />
          )}

          {!jsonFile ? (
            <FileDrop
              onClick={handleJSONUpload}
              onDrop={hanldeJSONFileDrop}
              onDragLeave={handleFileDragLeave}
              onDragOver={handleJSONFileDragOver}
              isDragOver={isJsonDragOver}
              fileType="JSON"
            />
          ) : (
            <FileUploadSection
              file={jsonFile}
              onRemove={handleJSONFileRemove}
              onUpload={handleJSONUpload}
            />
          )}
          <div
            className="position-absolute d-flex flex-row gap-5"
            style={{ bottom: "160px" }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsDragging(false)}
              className="align-self-center"
            >
              Back
            </Button>
            <Link to="/projectEdit">
              <Button variant="primary" size="lg">
                Upload
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Link section is bigger than Button section, click outside Button could trigger navigation,
             hard code a static height for temporary, need a better solution
          */}
          <Link to="/projectEdit" className="me-5" style={{ height: "60px" }}>
            <Button variant="primary" size="lg">
              Create Model
            </Button>
          </Link>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsDragging(true)}
            className="align-self-start ms-5"
          >
            Open Model
          </Button>
        </>
      )}
    </div>
  );
};

export default WelcomeButtons;
