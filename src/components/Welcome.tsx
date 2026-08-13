import React, {ChangeEvent, useRef, useState} from "react";
import {BsUpload} from "react-icons/bs";
import {Link} from "react-router-dom";
import LeonIcon from "/leon.png";
import ErrorModal, {ErrorModalProps} from "./ErrorModal";
import {useProjectLauncher} from "./utils/useProjectLauncher";
import styles from "./Welcome.module.css";

const Welcome: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [errorModal, setErrorModal] = useState<ErrorModalProps>({
        show: false,
        title: "",
        message: "",
        onHide: () => setErrorModal((previous) => ({...previous, show: false})),
    });

    const showError = (title: string, message: string) =>
        setErrorModal({
            show: true,
            title,
            message,
            onHide: () => setErrorModal((previous) => ({...previous, show: false})),
        });

    const {importProjectFile} = useProjectLauncher(showError);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) {
            await importProjectFile(file);
        }
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            await importProjectFile(file);
        }
    };

    return (
        <div className={styles.page} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <header className={styles.header}>
                <Link to="/" className={styles.brand} aria-label="AMMBER home">
                    <img src={LeonIcon} alt="AMMBER logo"/>
                    <span>AMMBER</span>
                </Link>
                <nav className={styles.nav} aria-label="Welcome navigation">
                    <Link to="/papers">Papers</Link>
                    <Link to="/papers/AMMBER_User_Manual.pdf" target="_blank">User manual</Link>
                    {/* <Link to="/projects" className={styles.navCta}>Open workspace <BsArrowRight/></Link> */}
                </nav>
            </header>

            <main className={styles.hero}>
                <section className={styles.intro}>
                    <h1>Make motivation clear.</h1>
                    <p className={styles.summary}>Create and edit motivational models in your browser.</p>
                    <div className={styles.actions}>
                        <Link to="/projects" className={styles.primaryAction} data-cy="get-started">
                            Get started
                        </Link>
                        <button type="button" className={styles.importAction} onClick={() => fileInputRef.current?.click()}>
                            <BsUpload/> Import project
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className={styles.fileInput}
                            onChange={handleFileChange}
                        />
                    </div>
                </section>

                <section className={styles.canvasStage} aria-label="AMMBER model preview">
                    <div className={styles.modelWindow}>
                        <div className={styles.windowBar}>
                            <div className={styles.windowBrand}>
                                <img src={LeonIcon} alt=""/>
                                <span>New motivation model</span>
                            </div>
                            <span className={styles.localBadge}>Saved locally</span>
                        </div>
                        <div className={styles.modelCanvas}>
                            <svg className={styles.connectors} viewBox="0 0 610 390" preserveAspectRatio="none" aria-hidden="true">
                                <path d="M145 195 C225 195 235 195 305 195"/>
                                <path d="M305 195 C375 195 385 195 465 195"/>
                            </svg>
                            <article className={`${styles.node} ${styles.nodeGoal}`}>
                                <span>Primary goal</span>
                                <strong>Build shared understanding</strong>
                            </article>
                            <article className={`${styles.node} ${styles.nodeCentre}`}>
                                <span>Motivation</span>
                                <strong>Align the team</strong>
                            </article>
                            <article className={`${styles.node} ${styles.nodePositive}`}>
                                <span>Positive influence</span>
                                <strong>Open collaboration</strong>
                            </article>
                            <div className={styles.canvasControls} aria-hidden="true">
                                <i>−</i><span>74%</span><i>+</i>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <ErrorModal {...errorModal}/>
        </div>
    );
};

export default Welcome;
