import {useRef, useState} from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";
import {BsPlus, BsSearch, BsThreeDots, BsUpload} from "react-icons/bs";
import {Link} from "react-router-dom";
import {useProjectContext} from "./context/ProjectContext";
import {useProjectLauncher} from "./utils/useProjectLauncher";
import {countGoals, formatRelativeTime, type Project} from "./utils/projects";
import {projectToModelJson, renderProjectImageSvg} from "./utils/projectImage";
import ErrorModal from "./ErrorModal";
import ShareModal from "./ShareModal";
import styles from "./Home.module.css";

const ProjectCard = ({project, onOpen}: {project: Project; onOpen: () => void}) => {
    const {renameProject, deleteProject} = useProjectContext();
    const [showRename, setShowRename] = useState(false);
    const [draft, setDraft] = useState(project.name);
    const [showDelete, setShowDelete] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const commitRename = () => {
        renameProject(project.id, draft);
        setShowRename(false);
    };
    return <article className={styles.card} data-cy="project-card">
        <Dropdown className={styles.cardMenu} align="end">
            <Dropdown.Toggle variant="outline-primary" size="sm" aria-label={`Options for ${project.name}`}><BsThreeDots/></Dropdown.Toggle>
            <Dropdown.Menu>
                <Dropdown.Item onClick={() => {setDraft(project.name); setShowRename(true);}}>Rename</Dropdown.Item>
                <Dropdown.Item onClick={() => setShowShare(true)}>Share</Dropdown.Item>
                <Dropdown.Item className="text-danger" onClick={() => setShowDelete(true)}>Delete</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
        <button type="button" className={styles.thumb} data-cy="open-project" onClick={onOpen}>
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderProjectImageSvg(projectToModelJson(project), false, false))}`}
                alt={`Preview of ${project.name}`} loading="lazy"/>
        </button>
        <div className={styles.cardBody}>
            <button type="button" className={styles.name} onClick={onOpen} data-cy="project-name">{project.name}</button>
            <div className={styles.meta}>{countGoals(project.treeData)} goals · Edited {formatRelativeTime(project.updatedAt)}</div>
        </div>
        <Modal show={showRename} onHide={() => setShowRename(false)} centered>
            <form onSubmit={(event) => {event.preventDefault(); commitRename();}}>
                <Modal.Header closeButton><Modal.Title>Rename project</Modal.Title></Modal.Header>
                <Modal.Body><input autoFocus className="form-control" aria-label="Project name" value={draft}
                    onChange={(event) => setDraft(event.target.value)}/></Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowRename(false)}>Cancel</Button>
                    <Button type="submit" disabled={!draft.trim()}>Save</Button></Modal.Footer>
            </form>
        </Modal>
        <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
            <Modal.Header closeButton><Modal.Title>Delete project</Modal.Title></Modal.Header>
            <Modal.Body>Delete “{project.name}”? This cannot be undone.</Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
                <Button variant="danger" data-cy="confirm-delete" onClick={() => {deleteProject(project.id); setShowDelete(false);}}>Delete project</Button></Modal.Footer>
        </Modal>
        <ShareModal show={showShare} showGraphSection={false} project={project} onHide={() => setShowShare(false)}/>
    </article>;
};

const Home = () => {
    const {projects} = useProjectContext();
    const {openEditor, launchNewProject, importProjectFile} = useProjectLauncher();
    const input = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const handleImport = async (file?: File) => {
        if (!file) return;
        try { await importProjectFile(file); }
        catch (reason) { setError(reason instanceof Error ? reason.message : "The model could not be imported."); }
    };
    const visible = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
        .filter((project) => project.name.toLowerCase().includes(query.trim().toLowerCase()));
    return <div className={styles.page} onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {event.preventDefault(); void handleImport(event.dataTransfer.files[0]);}}>
        <header className={styles.topBar}>
            <div className={styles.topBarInner}>
                <Link to="/" className={styles.brandLink}>AMMBER</Link>
                <div className={styles.topBarActions}>
                    <label className={styles.searchBox}><BsSearch/><input type="search" placeholder="Search projects"
                        aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)}/></label>
                    <Button variant="outline-primary" onClick={() => input.current?.click()}><BsUpload className="me-2"/>Import</Button>
                    <input ref={input} type="file" hidden accept=".json,.png,.svg,application/json,image/png,image/svg+xml"
                        onChange={(event) => {void handleImport(event.target.files?.[0]); event.target.value = "";}}/>
                </div>
            </div>
        </header>
        <main className={styles.main}>
            <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Your workspace</span>
                <div className={styles.titleRow}><h1 className={styles.heading}>Projects</h1>
                    {projects.length > 0 && <span className={styles.count}>{projects.length} {projects.length === 1 ? "project" : "projects"}</span>}</div>
                </div>
            </div>
            {projects.length === 0 ? <section className={styles.emptyState}>
                <h2>No projects yet</h2><p>Create a project or import a model to get started.</p>
                <Button onClick={launchNewProject} data-cy="new-project"><BsPlus/> New project</Button>
                <Button variant="outline-primary" className="ms-2" onClick={() => input.current?.click()}>Import</Button>
            </section> : <>
                <div className={styles.grid}>
                    <button type="button" className={styles.newCard} onClick={launchNewProject} data-cy="new-project">
                        <BsPlus size={28}/><span>New project</span></button>
                    {visible.map((project) => <ProjectCard key={project.id} project={project}
                        onOpen={() => openEditor(project)}/>)}
                </div>
                {visible.length === 0 && <p>No projects match “{query.trim()}”.</p>}
            </>}
        </main>
        <ErrorModal show={error !== null} title="Cannot Import Model" message={error ?? ""}
            onHide={() => setError(null)}/>
    </div>;
};
export default Home;
