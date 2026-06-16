import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/mm-local-editor/",
  css: {
    devSourcemap: true,
  },
  build: {
      outDir: 'dist',
  },
  publicDir: 'public'
});
