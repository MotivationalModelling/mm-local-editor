import { useState, useEffect } from "react";
import { ButtonGroup, FormControl } from "react-bootstrap";
import { useGraph } from "../context/GraphContext";

const ScaleTextButton = () => {
  const { graph } = useGraph(); 
  const [fontSize, setFontSize] = useState(12); 

  // Function to update font size from selected cells
  const updateFontSize = () => {
    if (!graph) return;
    const cells = graph.getSelectionCells();
    if (cells.length > 0) {
      const style = graph.getCellStyle(cells[0]); 
      const currentFontSize = style.fontSize || 12;
      setFontSize(currentFontSize);
    }
  };

  useEffect(() => {
    updateFontSize(); 
  }, [graph]);



  // Function to handle input changes for font size
  const handleFontSizeChange = (e) => {
    let newFontSize = parseInt(e.target.value, 10);
    if (isNaN(newFontSize)) {
      setFontSize(12); 
      return;
    }
    setFontSize(newFontSize);

    if (!graph || newFontSize < 8 || newFontSize > 40) return; 

    const cells = graph.getSelectionCells();
    graph.getDataModel().beginUpdate();
    try {
      cells.forEach((cell) => {
        const style = graph.getCellStyle(cell);
        style.fontSize = newFontSize;
        graph.getDataModel().setStyle(cell, style);
      });
    } finally {
      graph.getDataModel().endUpdate();
      graph.refresh();
    }
  };

  return (
    <ButtonGroup aria-label="Text Scaler">
      <FormControl
        type="number"
        value={fontSize || ""} 
        onChange={handleFontSizeChange}
        style={{ width: "60px", textAlign: "center" }}
        className="mx-2"
        min={8}
        max={40}
      />
    </ButtonGroup>
  );
};

export default ScaleTextButton;
