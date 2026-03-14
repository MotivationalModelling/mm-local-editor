import { useState } from "react";
import { useFileContext } from "../../context/FileProvider.tsx";
import { updateVisibilityForLineBetweenNonFunctionalGoal } from "../../context/treeDataSlice.ts";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";

const LineButtons = () => {
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const { dispatch } = useFileContext();

    const handleChange = (val: number) => {
        const newVisibility = val === 1;
        setIsVisible(newVisibility);
        dispatch(updateVisibilityForLineBetweenNonFunctionalGoal({ isVisibile: newVisibility }));
    };

    return (
        <div className="w-100 px-1">
            <div>
                <span className="fw-bold mb-1" style={{ fontSize: '0.7rem'}}>
                    Between Non-Functioanl Goal
                </span>
                <ToggleButtonGroup
                    className="w-100"
                    type="radio"
                    name="nf-toggle"
                    value={isVisible ? 1 : 0}
                    onChange={handleChange}
                >
                    <ToggleButton
                        id="nf-show" 
                        value={1} 
                        variant={isVisible ? "primary" : "outline-secondary"}
                        size="sm" 
                        className="p-0"
                    >
                        Show
                    </ToggleButton>
                    <ToggleButton
                        id="nf-hide" 
                        value={0} 
                        variant={!isVisible ? "primary" : "outline-secondary"}
                        size="sm" 
                        className="p-0"
                    >
                        Hide
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>
        </div>
    );
};
export default LineButtons;