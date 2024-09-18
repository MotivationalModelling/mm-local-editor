import { Button, ButtonGroup } from "react-bootstrap";
import { useGraph } from "../context/GraphContext";


const ScaleTextButton = () => {

    const { graph } = useGraph(); // Get the graph instance from the context

    // Function to increase the text size
    const increaseTextSize = () => {
        if (!graph) return;

        const cells = graph.getSelectionCells();
        graph.getDataModel().beginUpdate();
        try {
        cells.forEach((cell) => {
            const style = graph.getCellStyle(cell);
            // Default to 12 if fontSize is not defined
            let currentFontSize = style.fontSize || 12;
            // Increase font size, max 40
            currentFontSize = Math.min(currentFontSize + 2, 40); 
            style.fontSize = currentFontSize;
            graph.getDataModel().setStyle(cell, style);
        });
        } 
        finally {
        graph.getDataModel().endUpdate(); 
        graph.refresh(); 
        }
    };

    // Function to decrease the text size
    const decreaseTextSize = () => {
        if (!graph) return;

        const cells = graph.getSelectionCells();
        graph.getDataModel().beginUpdate();
        try {
        cells.forEach((cell) => {
            const style = graph.getCellStyle(cell); 
            let currentFontSize = style.fontSize || 12;
            // Decrease font size, min 8
            currentFontSize = Math.max(currentFontSize - 2, 8);
            style.fontSize = currentFontSize;
            graph.getDataModel().setStyle(cell, style);
        });
        } 
        finally {
        graph.getDataModel().endUpdate(); 
        graph.refresh();
        }
    };


    return (
        <ButtonGroup aria-label="Text Scaler">
            <Button variant="outline-primary" onClick={increaseTextSize}>
                +
            </Button>
            <Button variant="outline-primary" onClick={decreaseTextSize} className="ms-2">
                -
            </Button>
        </ButtonGroup>
    );

};

export default ScaleTextButton;
