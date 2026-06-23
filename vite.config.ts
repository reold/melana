// vite.config.ts — only the lazyChunkPreload plugin changes
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const lazyChunkPreload = (): Plugin => {
  let base = "/";
  return {
    name: "lazy-chunk-preload",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      base = config.base || "/";
    },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const tags: string[] = [];

        for (const [fileName, file] of Object.entries(ctx.bundle)) {
          if (typeof file === "string") continue;

          // Only preload JS chunks now — CSS preloads trigger "not used"
          // warnings when the user never opens the matching component.
          // The CSS will load on demand when the chunk executes; the HTTP
          // cache handles repeat visits.
          if (file.type === "chunk" && !file.isEntry) {
            if (!file.code || file.code.length < 1000) continue;
            tags.push(
              `<link rel="modulepreload" href="${base}${file.fileName}" fetchpriority="low" crossorigin>`,
            );
          }
        }

        if (tags.length === 0) return html;
        return html.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
      },
    },
  };
};

export default defineConfig({
  plugins: [svelte(), lazyChunkPreload()],
  base: "/melana/",
  build: {
    target: "es2022",
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("hls.js") || id.includes("hls/")) return "vendor-hls";
          if (id.includes("gsap")) return "vendor-gsap";
        },
      },
    },
  },
});
