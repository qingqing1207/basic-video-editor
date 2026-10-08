import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./packages/editor/src", import.meta.url)),
    },
  },
  test: {
    include: ["packages/editor/src/**/__tests__/*.test.ts", "tests/*.test.ts"],
    setupFiles: ["./tests/wasm-setup.ts"],
  },
});
