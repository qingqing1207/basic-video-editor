import { defineConfig, esmExternalRequirePlugin } from "vite";
import postcss from "./css-build.config.mjs";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const dependencies = Object.keys(
  JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))
    .dependencies,
).filter((name) => name !== "@basic-video-editor/render-wasm");
const root = fileURLToPath(new URL("./", import.meta.url));
export default defineConfig({
  plugins: [
    {
      name: "editor-wasm-resource",
      enforce: "pre",
      buildStart() {
        this.emitFile({
          type: "asset",
          fileName: "INTER-LICENSE.txt",
          source: readFileSync(
            new URL("./src/assets/INTER-LICENSE.txt", import.meta.url),
          ),
        });
      },
      resolveFileUrl({ relativePath }) {
        return `new URL(${JSON.stringify(relativePath)}, import.meta.url).href`;
      },
      transform(code, id) {
        if (id.includes("render-wasm/dist/") && id.endsWith(".js")) {
          const pattern =
            /new URL\(["']\.?\/?opencut_wasm_bg\.wasm["'],\s*import\.meta\.url\)\.href|new URL\(["']\.?\/?opencut_wasm_bg\.wasm["'],\s*import\.meta\.url\)/g;
          if (!pattern.test(code)) return;
          pattern.lastIndex = 0;
          const reference = this.emitFile({
            type: "asset",
            name: "editor.wasm",
            source: readFileSync(
              new URL(
                "../render-wasm/dist/opencut_wasm_bg.wasm",
                import.meta.url,
              ),
            ),
          });
          return {
            code: code.replace(
              pattern,
              `import.meta.ROLLUP_FILE_URL_${reference}`,
            ),
            map: null,
          };
        }
      },
    },
    esmExternalRequirePlugin({
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    }),
    react(),
  ],
  css: { postcss },
  resolve: { alias: { "@": root + "src" } },
  build: {
    target: "es2022",
    lib: {
      entry: { index: root + "src/index.tsx", "theme-preview": root + "src/theme/preview.tsx" },
      formats: ["es"],
      fileName: (_format, entry) => `${entry}.js`,
      cssFileName: "style",
    },
    rollupOptions: {
      external: (id) =>
        [...dependencies, "react", "react-dom"].some(
          (name) => id === name || id.startsWith(name + "/"),
        ),
      output: {
        assetFileNames: (asset) =>
          asset.names.some((name) => name.endsWith(".css"))
            ? "style.css"
            : "assets/[name]-[hash][extname]",
      },
    },
    sourcemap: true,
  },
});
