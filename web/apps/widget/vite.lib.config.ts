import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Production embed bundle: widget.iife.js */
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/embed.tsx",
      name: "SupportFlowWidget",
      fileName: "widget",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: "widget.[ext]",
      },
    },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
