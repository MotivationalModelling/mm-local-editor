import {renderToStaticMarkup} from "react-dom/server";
import {normaliseListLabelItems} from "./GraphLabelUtils";
import "./GraphListLabel.css";

const GraphListLabel = ({items}: {items: string[]}) => (
    <div className="d-flex align-items-center h-100 w-100 graph-list-label">
        <ul className="d-block m-0 text-start w-100 graph-list-label-items">
            {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
    </div>
);

// maxGraph's label/editor API accepts HTML, not a React element.
export const makeHtmlListLabel = (items: string[]): string => {
    const labels = normaliseListLabelItems(items);
    if (labels.length === 0) return "";
    return renderToStaticMarkup(<GraphListLabel items={labels}/>);
};
