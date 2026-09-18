/// <reference types="vitest/config" />
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {fileURLToPath} from "node:url";

const publicDir = fileURLToPath(new URL("./public", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  css: {
    devSourcemap: true,
  },
  build: {
      outDir: 'dist',
  },
  publicDir: 'public',
  test: {
    // Modules like initialTabs.ts import icons as root-absolute paths ("/img/Cloud.png").
    // Only the dev server serves publicDir at "/", so under test those resolve against the
    // project root and miss, which failed the whole suite at import time. The extension
    // guard keeps this away from ordinary absolute paths on POSIX runners.
    alias: [{find: /^\/(?=.*\.(?:png|svg|ico)$)/, replacement: `${publicDir}/`}],
    environment: "jsdom",
  },
});
