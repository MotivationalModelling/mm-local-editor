import { IoCloseCircle } from "react-icons/io5";

type FileUploadSectionProps = {
  file: File;
  onRemove: () => void;
  onUpload: () => void;
};

// Dropped files displaying section for user to remove and replace 
const FileUploadSection = ({
  file,
  onRemove,
  onUpload,
}: FileUploadSectionProps) => {
  return (
    <div className="mt-3 border border-primary-subtle rounded file-container p-4 align-content-center mx-5">
      {/* File remove button */}
      <div
        onClick={onRemove}
        style={{
          position: "relative",
          textAlign: "end",
          top: "-5px",
          right: "-35px",
        }}
      >
        <IoCloseCircle style={{ cursor: "pointer" }} size={20} />
      </div>
      <div onClick={onUpload} className="fs-5">
        {file.type === "text/xml" ? (
          <p>
            Goal Model XML file: <br />
            <strong>{file.name}</strong>
          </p>
        ) : file.type === "application/json" ? (
          <p>
            JSON file: <br />
            <strong>{file.name}</strong>
          </p>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;
