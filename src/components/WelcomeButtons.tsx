import { Button } from "react-bootstrap";
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import FileDrop from "./FileDrop";
import FileUploadSection from "./FileUploadSection";

const ALERT_MESSAGE = "Please select a file";

type WelcomeButtonsProps = {
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
};

const WelcomeButtons = ({ isDragging, setIsDragging }: WelcomeButtonsProps) => {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isXmlDragOver, setIsXmlDragOver] = useState(false);
  const [isJsonDragOver, setIsJsonDragOver] = useState(false);

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

  const handleXMLUpload = () => {
    if (xmlFileRef.current) {
      console.log(xmlFileRef.current);
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

  const handleXMLFileInputChange = (file: File | undefined) => {
    if (!file) {
      setIsXmlDragOver(false);
      alert(ALERT_MESSAGE);
      return;
    }

    if (file.type !== "text/xml") {
      setIsXmlDragOver(false);
      alert("Please select an XML file.");
      return;
    }

    setXmlFile(file);
  };

  const handleJSONFileInputChange = (file: File | undefined) => {
    if (!file) {
      setIsJsonDragOver(false);
      alert(ALERT_MESSAGE);
      return;
    }

    if (file.type !== "application/json") {
      setIsJsonDragOver(false);
      alert("Please select a JSON file.");
      return;
    }

    setJsonFile(file);
  };

  const handleXMLFileRemove = () => {
    setXmlFile(null);
    setIsXmlDragOver(false);
  };

  const handleJSONFileRemove = () => {
    setJsonFile(null);
    setIsJsonDragOver(false);
  };

  return (
    <div
      className="d-flex justify-content-center mt-3"
      style={{ height: "100px" }}
    >
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

      {/* Show drop area when files are dragged into the page */}
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
          <Link to="/projectEdit" className="me-5">
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
