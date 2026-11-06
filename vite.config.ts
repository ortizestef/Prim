import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "web",
  base: "/Prim/",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "phaser-engine": ["phaser"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
