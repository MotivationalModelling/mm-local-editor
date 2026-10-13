import {defineConfig, loadEnv} from "vite";
import react from "@vitejs/plugin-react";
import {openaiUserStories} from "./server/openaiUserStories.ts";

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), "OPENAI_");
  return {
    plugins: [react(), openaiUserStories(process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY)],
    base: "/mm-local-editor/",
    css: {
      devSourcemap: true,
    },
    build: {
      outDir: "dist",
    },
    publicDir: "public",
  };
});
