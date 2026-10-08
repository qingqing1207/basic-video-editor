import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative, dirname, join } from "node:path";
const root = resolve("packages/editor/dist/types");
const wasmTypes = resolve("packages/render-wasm/dist");
const vendored = join(root, "render-wasm");
// render-wasm is a private build-time package: ship its declarations inside the editor package so hosts install one package.
await mkdir(vendored, { recursive: true });
for (const name of ["index.d.ts", "opencut_wasm.d.ts"])
  await copyFile(join(wasmTypes, name), join(vendored, name));
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (path.endsWith(".d.ts")) {
      let text = await readFile(path, "utf8");
      text = text.replace(/(["'])@\/([^"']+)\1/g, (_, quote, module) => {
        let target = relative(dirname(path), join(root, module));
        if (!target.startsWith(".")) target = "./" + target;
        return quote + target + quote;
      });
      text = text.replace(
        /(["'])@basic-video-editor\/render-wasm\1/g,
        (_, quote) => {
          let target = relative(dirname(path), join(vendored, "index"));
          if (!target.startsWith(".")) target = "./" + target;
          return quote + target + quote;
        },
      );
      await writeFile(path, text);
    }
  }
}
await visit(root);
