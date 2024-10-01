import React from "react";

interface Props {
  message: string
}

const WarningMessage: React.FC<Props> = ({message}) => {
  return (
      <span className="text-warning"
            style={{
                // position: "fixed",
                bottom: "10px",
                right: "10px",
                padding: "10px",
                borderRadius: "5px",
                zIndex: 5,
            }}>
      {message}
    </span>
  );
};

export default WarningMessage;