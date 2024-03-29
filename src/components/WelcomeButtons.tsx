import { Button } from "react-bootstrap";
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import "./WelcomeButtons.css";

const ALERT_MESSAGE =
  "Please select two files, one Goal Model XML file and one JSON file.";

type WelcomeButtonsProps = {
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
};

const WelcomeButtons = ({ isDragging, setIsDragging }: WelcomeButtonsProps) => {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File drag and drop
  const hanldeFileDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const dropFiles = evt.dataTransfer.files;
    handleFileInputChange(dropFiles);
  };

  const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleFileDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (files: FileList | null) => {
    if (!files || files.length !== 2) {
      setIsDragging(false);
      alert(ALERT_MESSAGE);
      return;
    }

    let hasXML = false;
    let hasJSON = false;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type === "text/xml") {
        hasXML = true;
        setXmlFile(files[i]);
      } else if (files[i].type === "application/json") {
        hasJSON = true;
        setJsonFile(files[i]);
      }
    }

    if (!hasXML || !hasJSON) {
      setIsDragging(false);
      alert(ALERT_MESSAGE);
    }
    return;
  };

  type DropAreaProps = {
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    // onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  };

  const DropArea = ({
    onDrop,
    onDragOver,
    // onDragEnter,
    onDragLeave,
  }: DropAreaProps) => {
    return (
      <div
        className={`drop-area ${isDragOver ? "drag-over" : ""}`}
        onDragOver={onDragOver}
        // onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <FiPlus className="plus-icon" /> {/* Plus icon */}
        <p>Drop files here</p>
      </div>
    );
  };

  return (
    <div
      className="d-flex justify-content-evenly mt-3"
      style={{ height: "100px" }}
    >
      {/* File Input */}
      <input
        type="file"
        accept=".xml, .json"
        multiple
        onChange={(e) => handleFileInputChange(e.target.files)}
        style={{ display: "none" }}
        ref={fileInputRef}
      />
      {/* Show drop area when files are dragged into the page*/}
      {isDragging ? (
        <DropArea
          onDrop={hanldeFileDrop}
          onDragLeave={handleFileDragLeave}
          onDragOver={handleFileDragOver}
        />
      ) : (
        <>
          <Link to="/projectEdit">
            <Button variant="primary" size="lg">
              Create Model
            </Button>
          </Link>
          <Button
            variant="primary"
            size="lg"
            onClick={handleUpload}
            className="align-self-start"
          >
            Open Model
          </Button>
        </>
      )}

      {xmlFile && jsonFile && (
        <div className="mt-3">
          <p>Goal Model XML file: {xmlFile.name}</p>
          <p>JSON file: {jsonFile.name}</p>
        </div>
      )}
    </div>
  );
};

export default WelcomeButtons;
