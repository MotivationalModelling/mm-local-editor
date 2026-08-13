import React, {ChangeEvent, useRef, useState} from "react";
import {BsFileEarmarkPlus, BsPlus, BsSearch, BsUpload} from "react-icons/bs";
import {Link} from "react-router-dom";
import LeonIcon from "/leon.png";
import {useProjectContext} from "./context/ProjectContext";
import {useProjectLauncher} from "./utils/useProjectLauncher";
import ErrorModal, {ErrorModalProps} from "./ErrorModal";
import ProjectCard from "./ProjectCard";
import styles from "./Home.module.css";

const Home: React.FC = () => {
    const {projects, renameProject, deleteProject} = useProjectContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [errorModal, setErrorModal] = useState<ErrorModalProps>({
        show: false,
        title: "",
        message: "",
        onHide: () => setErrorModal((prev) => ({...prev, show: false})),
    });

    const showError = (title: string, message: string) =>
        setErrorModal({show: true, title, message, onHide: () => setErrorModal((prev) => ({...prev, show: false}))});

    const {openEditor, launchNewProject, importProjectFile} = useProjectLauncher(showError);

    const handleFileChange = async (evt: ChangeEvent<HTMLInputElement>) => {
        const file = evt.target.files?.[0];
        evt.target.value = "";
        if (file) {
            await importProjectFile(file);
        }
    };

    const handleDrop = async (evt: React.DragEvent<HTMLDivElement>) => {
        evt.preventDefault();
        const file = evt.dataTransfer.files?.[0];
        if (file) {
            await importProjectFile(file);
        }
    };

    const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
    const visibleProjects = sortedProjects.filter((project) =>
        project.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    return (
        <div className={styles.page} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <header className={styles.topBar}>
                <Link to="/" className={styles.brandLink}>
                    <img src={LeonIcon} alt="AMMBER" className={styles.logo}/>
                    <strong className={styles.brand}>AMMBER</strong>
                </Link>
                <div className={styles.topBarActions}>
                    <div className={styles.searchBox}>
                        <BsSearch className={styles.searchIcon}/>
                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder="Search projects"
                            aria-label="Search projects"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    {/* <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <BsUpload/>
                        Import
                    </button> */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{display: "none"}}
                        onChange={handleFileChange}
                    />
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.sectionHeader}>
                    <div>
                        <span className={styles.eyebrow}>Your workspace</span>
                        <h1 className={styles.heading}>Projects</h1>
                    </div>
                    {projects.length > 0 && (
                        <span className={styles.count}>
                            {projects.length} {projects.length === 1 ? "project" : "projects"}
                        </span>
                    )}
                </div>

                {projects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <BsFileEarmarkPlus/>
                        </div>
                        <p className={styles.emptyTitle}>No projects yet</p>
                        <p className={styles.emptyText}>
                            Create a project or import a model to get started.
                        </p>
                        <div className={styles.emptyActions}>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={launchNewProject}
                                data-cy="new-project"
                            >
                                <BsPlus/>
                                New project
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnOutline}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <BsUpload/>
                                Import
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            <button
                                type="button"
                                className={styles.newCard}
                                onClick={launchNewProject}
                                data-cy="new-project"
                            >
                                <span className={styles.newCardIcon}>
                                    <BsPlus/>
                                </span>
                                <span>New project</span>
                            </button>
                            {visibleProjects.map((project, index) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    onOpen={() => openEditor(project)}
                                    onRename={(name) => renameProject(project.id, name)}
                                    onDelete={() => deleteProject(project.id)}
                                />
                            ))}
                        </div>
                        {visibleProjects.length === 0 && (
                            <p className={styles.noMatch}>No projects match &ldquo;{query.trim()}&rdquo;.</p>
                        )}
                    </>
                )}
            </main>

            <ErrorModal {...errorModal}/>
        </div>
    );
};

export default Home;
