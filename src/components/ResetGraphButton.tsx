import React from "react";
import {Dropdown, DropdownButton} from "react-bootstrap";
import {useGraph} from "./context/GraphContext.tsx";

const ResetGraphButton: React.FC  = () => {
    const {graph} = useGraph();
   // Function to reset the graph to empty
    const resetEmptyGraph = () => {
        if (graph) {
            graph.getDataModel().clear();
            onResetEmpty();
            // setIsDefaultReset(false);
        }
    };

    // Function to reset the graph to the default set of goals
    const resetDefaultGraph = () => {
        if (graph) {
            graph.getDataModel().clear();
            onResetEmpty();
            // setIsDefaultReset(true);
        }
    };

    return (
        <DropdownButton id="reset-graph-button"
                        title="Reset"
                        size="sm"
                        className="me-auto">
            <Dropdown.Item onClick={resetEmptyGraph}>
                Empty
            </Dropdown.Item>
            <Dropdown.Item onClick={resetDefaultGraph}>
                Default
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default ResetGraphButton;