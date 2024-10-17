import { useState, useEffect } from "react";
import { ButtonGroup, FormControl } from "react-bootstrap";
import { useGraph } from "../context/GraphContext";

const ScaleTextButton = () => {
  const { graph } = useGraph(); 
  const [fontSize, setFontSize] = useState(12); 

  useEffect(() => {
    if (!graph) return;

    // Function to update displayed font size using selected cells font size value
    const updateFontSize = () => {
      if (!graph) return;
      const cells = graph.getSelectionCells();
      if (cells.length > 0) {
        const style = graph.getCellStyle(cells[0]); 
        const currentFontSize = style.fontSize || 12;
        setFontSize(currentFontSize);
      }
    };

    // Listener to update font size whenever the cell selection changes
    const selectionListener = () => {
      updateFontSize();
    };

    // Attach the listener
    graph.getSelectionModel().addListener("change", selectionListener);

    // Cleanup the listener when the component unmounts
    return () => {
      graph.getSelectionModel().removeListener(selectionListener);
    };
  }, [graph]);


  // Function to update selected cells' font size values
  const handleFontSizeChange = (e) => {
    // Parse input value
    const newFontSize = parseInt(e.target.value, 10);
    if (isNaN(newFontSize)) {
      setFontSize(12); 
      return;
    }
    setFontSize(newFontSize);
    // Currently font size is set to never be smaller than 8, or bigger than 40
    if (!graph || newFontSize < 8 || newFontSize > 40) return; 

    // Update font sizes of each selected cells
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
