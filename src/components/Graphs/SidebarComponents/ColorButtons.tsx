import {Graph} from "@maxgraph/core";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";

type ColorButtonsProps = {
    graph: Graph;
};

const ColorButtons = ({graph}: ColorButtonsProps) => {
      const setColor = (color: string) => {
          graph.getDataModel().beginUpdate();
          try {
              for (const cell of graph.getSelectionCells()) {
                  const style = graph.getCellStyle(cell);
                  style.fillColor = color;
                  graph.getDataModel().setStyle(cell, style);
              }
          } finally {
              graph.getDataModel().endUpdate();
          }
      };

    // Note that the colours are copies from the bootstrap variants and won't track changes there
    return (
        <ButtonGroup vertical className="w-100">
            <Button variant="danger"
                    onClick={() => setColor("#DB3545")}>
                HIGH
                </Button>
            <Button variant="warning"
                    onClick={() => setColor("#FFC107")}>
                MEDIUM
            </Button>
            <Button variant="success"
                    onClick={() => setColor("#198754")}>
                LOW
            </Button>
        </ButtonGroup>
    )
};

export default ColorButtons;