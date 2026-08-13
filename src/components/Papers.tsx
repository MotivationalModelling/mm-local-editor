import {useState} from "react";
import {BsArrowLeft, BsArrowUpRight} from "react-icons/bs";
import {Link} from "react-router-dom";
import LeonIcon from "/leon.png";
import {papers} from "../data/papers";
import PaperReferenceList, {Reference} from "./PaperReferenceList";
import styles from "./Papers.module.css";

const Papers = () => {
    const [selectedPaper, setSelectedPaper] = useState<Reference>(papers[0]);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link to="/" className={styles.brand} aria-label="AMMBER home">
                    <img src={LeonIcon} alt="AMMBER logo"/>
                    <span>AMMBER</span>
                </Link>
                <Link to="/" className={styles.backLink}><BsArrowLeft/> Back home</Link>
            </header>

            <main className={styles.main}>
                <aside className={styles.library}>
                    <div className={styles.libraryHeading}>
                        <span>Research library</span>
                        <h1>Papers</h1>
                    </div>
                    <PaperReferenceList
                        references={papers}
                        selectedLink={selectedPaper.link}
                        onSelect={setSelectedPaper}
                    />
                    <a
                        href="https://www.leonsterling.com/about-research-report-series"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.moreLink}
                    >
                        More research <BsArrowUpRight/>
                    </a>
                </aside>

                <section className={styles.preview} aria-label="PDF preview">
                    <div className={styles.previewHeader}>
                        <div>
                            <span>Previewing</span>
                            <strong>{selectedPaper.title}</strong>
                        </div>
                        <a href={selectedPaper.link} target="_blank" rel="noreferrer">
                            Open PDF <BsArrowUpRight/>
                        </a>
                    </div>
                    <iframe
                        key={selectedPaper.link}
                        src={`${selectedPaper.link}#view=FitH`}
                        title={`Preview of ${selectedPaper.title}`}
                    />
                </section>
            </main>
        </div>
    );
};

export default Papers;
