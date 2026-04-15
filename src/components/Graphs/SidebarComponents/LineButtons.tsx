import {useFileContext} from "../../context/FileProvider.tsx";
import {setVisibilityForLinesBetweenNonFunctionalGoals} from "../../context/treeDataSlice.ts";
import {Form} from "react-bootstrap";

const LineButtons = () => {
    const {showLineBetweenNonFunctionalGoals, dispatch} = useFileContext();

    return (
        <Form.Group className="px-2 py-1 d-flex flex-column">
            <Form.Label>
                Between non-functional goals
            </Form.Label>

            <Form.Check
                type="switch"
                id="line-switch"
                checked={showLineBetweenNonFunctionalGoals}
                onChange={(e) => dispatch(setVisibilityForLinesBetweenNonFunctionalGoals(
                    e.target.checked
                ))}
            />
        </Form.Group>
    );
};
export default LineButtons;