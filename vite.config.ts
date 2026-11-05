import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Prim/",
  plugins: [react()],
  build: {
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