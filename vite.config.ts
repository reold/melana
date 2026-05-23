import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  base: "/melana/",
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into their own chunks
        manualChunks(id) {
          if (id.includes("hls.js") || id.includes("hls/")) {
            return "vendor-hls";
          }
          if (id.includes("gsap")) {
            return "vendor-gsap";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
