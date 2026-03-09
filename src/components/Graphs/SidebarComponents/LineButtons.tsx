import { useState } from "react";
import { useFileContext } from "../../context/FileProvider.tsx";
import { updateVisibilityForEdge } from "../../context/treeDataSlice.ts";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";


const LineButtons = () => {
    const [nonFunctionalExist, setNonFunctionalExist] = useState<number>(1);
    const [functionalExist, setFunctionalExist] = useState<number>(1);
    const { dispatch } = useFileContext();

    const changeVisibility = (isNonFunctionalEdge: boolean, val: number) => {
        const isVisibile = val === 1;
        dispatch(updateVisibilityForEdge({isNonFunctionalEdge, isVisibile}));
    };

    const miniBtnStyle = { 
        fontSize: '0.55rem', 
        paddingLeft: 0, 
        paddingRight: 0 
    };

    return (
        <div className="w-100 px-1">
            <div className="d-flex flex-column mb-3"> 
                <span className="fw-bold mb-1" style={{ fontSize: '0.55rem' }}>Non-functional:</span>
                <ToggleButtonGroup
                    className="w-100 d-flex"
                    type="radio"
                    name="non-functional-toggle"
                    value={nonFunctionalExist} 
                    onChange={(val: number) => {
                        setNonFunctionalExist(val);
                        changeVisibility(true, val);
                    }}
                >
                    <ToggleButton 
                        id="nf-show" value={1} variant="outline-primary" 
                        size="sm" className="flex-fill" 
                        style={miniBtnStyle}
                    >
                        Show
                    </ToggleButton>
                    <ToggleButton 
                        id="nf-hide" value={0} variant="outline-secondary" 
                        size="sm" className="flex-fill"
                        style={miniBtnStyle}
                    >
                        Hide
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>

            <div className="d-flex flex-column mb-3">
                <span className="fw-bold mb-1" style={{ fontSize: '0.55rem' }}>Functional:</span>
                <ToggleButtonGroup
                    className="w-100 d-flex"
                    type="radio"
                    name="functional-toggle"
                    value={functionalExist}
                    onChange={(val: number) => {
                        setFunctionalExist(val);
                        changeVisibility(false, val);
                    }}
                >
                    <ToggleButton 
                        id="f-show" value={1} variant="outline-primary" 
                        size="sm" className="flex-fill" 
                        style={miniBtnStyle}
                    >
                        Show
                    </ToggleButton>
                    <ToggleButton 
                        id="f-hide" value={0} variant="outline-secondary" 
                        size="sm" className="flex-fill" 
                        style={miniBtnStyle}
                    >
                        Hide
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>
        </div>
    );
};
export default LineButtons;