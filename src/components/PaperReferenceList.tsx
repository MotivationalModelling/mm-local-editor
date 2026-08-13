import React from "react";
import {BsFileEarmarkPdf} from "react-icons/bs";
import styles from "./Papers.module.css";

export interface Reference {
    title: string
    link: string
    summary?: string
}

interface Props {
    references: Reference[]
    selectedLink: string
    onSelect: (paper: Reference) => void
}

const PaperReferenceList: React.FC<Props> = ({references, selectedLink, onSelect}) => (
    <div className={styles.paperList}>
        {references.map((paper) => (
            <button
                type="button"
                key={paper.link}
                className={`${styles.paperCard} ${paper.link === selectedLink ? styles.paperCardSelected : ""}`}
                onClick={() => onSelect(paper)}
            >
                <BsFileEarmarkPdf/>
                <span>
                    <strong>{paper.title}</strong>
                    {paper.summary && <small>{paper.summary}</small>}
                </span>
            </button>
        ))}
    </div>
);

export default PaperReferenceList;
