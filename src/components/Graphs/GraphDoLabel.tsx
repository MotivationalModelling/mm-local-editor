import {renderToStaticMarkup} from "react-dom/server";
import {normaliseLabelText} from "./GraphLabelUtils";
import "./GraphDoLabel.css";

const GraphDoLabel = ({text}: {text: string}) => (
    <div className="d-flex align-items-center h-100 w-100 graph-do-label">
        <div className="goal-label-text w-100 text-center">{text}</div>
    </div>
);

export const makeHtmlDoLabel = (text: string): string => text
    ? renderToStaticMarkup(<GraphDoLabel text={normaliseLabelText(text)}/>)
    : "";
