// WarningMessage.tsx
import React from "react";

type WarningMessageProps = {
  showWarning: boolean; // Receive only a boolean prop
};

const WarningMessage: React.FC<WarningMessageProps> = ({ showWarning }) => {
  if (!showWarning) return null; // Do not render anything if there is no need for a warning

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        backgroundColor: "yellow",
        padding: "10px",
        borderRadius: "5px",
        zIndex: 5,
      }}
    >
      No functional goals found
    </div>
  );
};

export default WarningMessage;