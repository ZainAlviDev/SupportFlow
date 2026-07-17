import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Local test page at http://localhost:4173 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    cors: true,
  },
  preview: {
    port: 4173,
  },
});
