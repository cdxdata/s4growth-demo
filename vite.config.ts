import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: '/', // Use '/' if deploying to a user page (username.github.io), or '/repo-name/' if it is a project repository
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
});
