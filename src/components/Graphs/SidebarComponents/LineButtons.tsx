import {useFileContext} from "../../context/FileProvider.tsx";
import {setVisibilityForLinesBetweenNonFunctionalGoals} from "../../context/treeDataSlice.ts";
import {ToggleButton, ToggleButtonGroup} from "react-bootstrap";

const LineButtons = () => {
    const {showLineBetweenNonFunctionalGoal, dispatch} = useFileContext();
    const isVisible = showLineBetweenNonFunctionalGoal; 

    return (
        <div className="w-100 px-1">
            <div>
                <span className="fw-bold mb-1" style={{fontSize: '0.7rem'}}>
                    Between Non-Functional Goal
                </span>
                <ToggleButtonGroup
                    className="w-100"
                    type="radio"
                    name="nf-toggle"
                    value={isVisible ? 1 : 0}
                    onChange={(val: number) => 
                        dispatch(setVisibilityForLinesBetweenNonFunctionalGoals({ 
                            showLines: val === 1 
                        }))
                    }
                >
                    <ToggleButton
                        id="nf-show"
                        value={1}
                        variant={"outline-primary"}
                        size="sm"
                        className="p-0"
                    >
                        Show
                    </ToggleButton>
                    <ToggleButton
                        id="nf-hide"
                        value={0}
                        variant={"outline-primary"}
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