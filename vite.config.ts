import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  base: "/melana/",
  build: {
    // Aligns your bundle with modern browser baselines
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Explicitly isolate massive third-party assets
          if (id.includes("hls.js") || id.includes("hls/")) {
            return "vendor-hls";
          }
          if (id.includes("gsap")) {
            return "vendor-gsap";
          }
          // REMOVED: catch-all "vendor" string block.
          // Vite naturally splits standard node_modules far more efficiently.
        },
      },
    },
  },
});
