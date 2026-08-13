// The app is deployed to GitHub Pages under the /mm-local-editor/ subpath, but
// may also be opened directly at the root (e.g. http://localhost:5173/ or
// http://<ip>:<port>/). React Router renders nothing when the URL does not start
// with the basename, so only apply it when the current path actually needs it.
export const getBasename = (pathname: string = window.location.pathname): string =>
	pathname.startsWith("/mm-local-editor") ? "/mm-local-editor" : "/";
