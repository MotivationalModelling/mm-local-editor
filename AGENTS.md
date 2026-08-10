# Repository Guidelines

## Project Structure & Module Organization

The React application lives in `src/`; entry points are `src/main.tsx` and `src/App.tsx`. Keep UI features in `src/components/`, graph-editor code in `src/components/Graphs/`, shared helpers in `src/components/utils/`, state providers in `src/components/context/`, and seed data in `src/data/`. Browser assets go in `public/`; documentation screenshots are in `wiki_images/`. Add end-to-end specs under `cypress/`.

## Build, Test, and Development Commands

Use npm with Node 18.18+ or 20.20+.

- `npm install` — install locked project dependencies.
- `npm run dev` — start the Vite development server.
- `npm run build` — create a production build in `dist/`.
- `npm run preview` — serve the built output locally.
- `npm run lint` — run ESLint on `.ts` and `.tsx` files; warnings fail the command.
- `npm test` — launch Vitest in watch mode. Use `npm test -- --run` for one CI-style pass.

## Coding Style & Naming Conventions

Write TypeScript and React function components in `.ts`/`.tsx` files. Use PascalCase filenames and exports (for example, `GraphSidebar.tsx`), camelCase functions and values, and `*.test.ts(x)` tests. Keep component CSS nearby; CSS modules use `*.module.css`. ESLint requires no spaces inside array brackets, object braces, or parentheses. Match surrounding formatting and run lint before submitting.

## Testing Guidelines

Use Vitest for unit tests and Testing Library for component behavior. Place tests next to covered code, such as `GraphHelpers.test.ts` beside `GraphHelpers.tsx`. Write descriptive `describe` and `it` labels; use `it.each` for variants. Add or update tests whenever changing graph calculations, state slices, file handling, or visible behavior. Run `npm test -- --run` and lint before a pull request.

## Commit & Pull Request Guidelines

Use concise imperative subjects. Existing history favors `feat:`, `fix:`, `chore:`, and `doc:` prefixes (for example, `fix: preserve selected goal position`). Label dependency changes as chores. PRs should explain the change, link its issue, include test results, and attach screenshots for UI or graph-rendering changes. Avoid unrelated changes in one PR.

Name branches by work type, for example: `feature/export-quality`, `fix/broken-icons`, or `chore/update-dependencies`.

No direct commits to `develop` or `main`. All changes go through feature branches and PRs. Each PR needs at least one approval before merging.

## Configuration & Generated Files

Do not commit `dist/` or local dependency directories. Keep deployment settings in Vite/Cypress config files and review public assets for licensing and size before adding them.
