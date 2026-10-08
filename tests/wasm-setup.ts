import { readFile } from "node:fs/promises";
import initialize from "../packages/render-wasm/dist/opencut_wasm.js";
await initialize({
  module_or_path: await readFile(
    new URL(
      "../packages/render-wasm/dist/opencut_wasm_bg.wasm",
      import.meta.url,
    ),
  ),
});
import { Canvas } from "@napi-rs/canvas";
// Node has no canvas. The retained text-mask geometry tests require real text measurement.
Object.defineProperty(globalThis, "OffscreenCanvas", {
  value: Canvas,
  configurable: true,
});
