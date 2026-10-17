# Authentication Evaluation

**Issue:** #346 — Evaluate authentication options and whether auth is needed  
**Date:** October 2026  
**Status:** Concluded — authentication is not required

## Summary

The Motivational Model Local Editor is a **static single-page application (SPA)** that runs entirely in the browser. There is no backend server, no database, and no user accounts. All model data is stored in the browser's `sessionStorage` and persisted only for the duration of a browser tab's session.

Given this architecture, authentication serves no purpose and would add unnecessary complexity.

## Current Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Hosting | GitHub Pages | Static file serving only |
| Frontend | React + TypeScript + Vite | Runs entirely client-side |
| Data storage | `sessionStorage` | Per-tab, cleared when the tab closes |
| File I/O | File System Access API | User picks files manually via browser dialog |
| Backend | None | No server, no API, no database |

## Why Authentication Is Not Needed

1. **No shared state.** Each tab has its own `sessionStorage`. There is nothing to protect from other users because there are no other users accessing the same data.

2. **No server-side resources.** Authentication controls access to resources. This app has no server-side resources — everything runs in the browser.

3. **No user identity requirement.** The editor does not need to know who is using it. There are no user profiles, no saved sessions, and no collaboration features.

4. **File access is user-controlled.** The browser's File System Access API already requires explicit user consent for each file operation. The OS file permission model is the appropriate access control layer.

## When to Reconsider

Authentication would become relevant if any of the following are added:

- A backend server or API
- Cloud storage or sync (saving models to a remote database)
- Multi-user collaboration (real-time editing, shared models)
- User-specific settings or preferences stored server-side
- Role-based access control (e.g. read-only sharing of models)

## Options Evaluated

| Option | Verdict | Reason |
|--------|---------|--------|
| No auth (current) | **Recommended** | Matches the static SPA architecture |
| GitHub OAuth | Not needed | No backend to validate tokens against |
| Firebase Auth | Not needed | Would require adding Firebase as a dependency with no benefit |
| Basic password gate | Not needed | Would only add friction without protecting anything |

## Conclusion

Authentication is not needed for the current architecture. This decision should be revisited if the application gains server-side components or multi-user features.
