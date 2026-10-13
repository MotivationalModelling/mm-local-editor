# Motivational Model Local Editor

[Motivational Model Editor](https://www.leonsterling.com/aboutmotivationalmodelling) is a web application built on HTML, CSS, JavaScript with the help of Bootstrap, Jquery and Mxgraph
for the front-end, RestFul API and Node.js framework for the backend.

This repository stores the local editor version used by developers for implementing & testing new functionalities and for debugging.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development.

### 1. Prerequisites

You will need to have [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on the computer before you can start the React installation process. It is recommended that you choose a version higher than [v20.20.0](https://nodejs.org/en/download/package-manager) or v18.18.0.

### 1.1 [Optional]
It is  recommended that you install [node version manager (NVM)](https://github.com/nvm-sh/nvm) as a tool for installing Nodejs, npm, and for managing Node versions on your device. For detailed instructions, visit:

```
https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/
```

After you successfully installed NVM, you can run

```
nvm ls
```
in your terminal for checking all the versions of node you have installed on your machine.

Use

```
nvm use [the version you desire]
```

to switch versions of node you use.

#### 1.2 Installing Nodejs:
for mac users

```
brew install nodejs
```

for windows users

```
https://nodejs.org/en/download/
```

#### 1.3 Installing npm:
To install the latest version of npm: 
```
npm install -g npm
```

#### 1.4 Checking:
If you want to verify the version of node or npm you are using, open your terminal and enter command:

```
node -v
```

and

```
npm -v
```

### 2. Installing

To run a React app locally, make sure you are at directory
```
.\mm-local-editor
```
then you must install it by running command:

```
npm install
```

after the installation has completed, use 

```
npm run dev
```
to start the server. Then the server will be running on port 5173

```
https://localhost:5173
```
Alternatively, if you choose [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable) as your package manager, you can run
```
yarn install
```
then
```
yarn dev
```
to achieve the same outcome.

### OpenAI user story generation

Set the server-side API key in `.env`:

```dotenv
OPENAI_API_KEY=your_openai_api_key
```

Restart `npm run dev` after changing the key. User stories use the OpenAI Responses
API with `gpt-6-astra` and medium reasoning. The local Vite server reads the key,
collects the streamed response, and returns the completed text for validation.
The key is never included in browser code. Do not prefix it with `VITE_`.

This endpoint also works with `npm run preview` after building. Static hosting
(including GitHub Pages) requires a separate backend implementing
`POST /mm-local-editor/api/user-stories`; the built files alone cannot call this
server-side endpoint.

Each generation request includes the project background, the complete model
hierarchy (without editor layout metadata), and a separate list of target
functional leaves. The AI generates one story per target leaf and uses the full
model to understand its purpose and derive a supported business value.
Stakeholders (`Who`), quality goals (`Be`), and emotional goals (`Feel`) accumulate
from the root through the leaf's ancestors, together with local attachments;
local values do not override inherited ones. Sibling branches stay separate.
Repeated labels appear once, while all distinct applicable instance IDs are
retained for linking and validation. Concerns retain local values or fall back
to the nearest functional ancestor with concerns. Quality and emotional goals
are expressed in the story only when they meaningfully clarify it.

### User story epics

The first-level `Do` nodes under the central model node form the epics. Terminal
`Do` nodes belong to the epic at the top of their branch, including deeply nested
leaves. In a shallow model, a first-level `Do` that is itself terminal can also
have its own story. Ownership comes from model instance IDs; AI output stays in
the existing story JSON format.

The User stories view supports folding epics, approval counts, and adding epics
to the model. When adding a story, choose its epic and either an existing leaf or
a new leaf based on the story's action. Model moves and renames update the groups;
stories whose source was removed or is no longer a leaf stay visible under
**Unlinked stories**.

### 3. Running the app 
If you followed the instructions above correctly, you should be able to open the app from your browser at 
```
https://localhost:5173/mm-local-editor/
```
Feel free to have a play with it to try out its functionalities!
## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
