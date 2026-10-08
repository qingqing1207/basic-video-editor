import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, existsSync } from "node:fs";
const workspace = fileURLToPath(new URL("../", import.meta.url));
const directory = resolve(workspace, "packages/render-wasm");
const localCargo = resolve(workspace, ".tools/cargo");
const useLocal =
  existsSync(resolve(localCargo, "bin/cargo")) && !process.env.CARGO_HOME;
const env = useLocal
  ? {
      ...process.env,
      CARGO_HOME: localCargo,
      RUSTUP_HOME: resolve(workspace, ".tools/rustup"),
    }
  : process.env;
const cargo = useLocal ? resolve(localCargo, "bin/cargo") : "cargo";
const bindgen = useLocal
  ? resolve(localCargo, "bin/wasm-bindgen")
  : "wasm-bindgen";
const version = spawnSync(bindgen, ["--version"], { env, encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "wasm-bindgen 0.2.116") {
  throw new Error(
    "Install the pinned tool: cargo install wasm-bindgen-cli --version 0.2.116 --locked",
  );
}
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: directory,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(cargo, [
  "build",
  "--locked",
  "--target",
  "wasm32-unknown-unknown",
  "--release",
  "-p",
  "opencut-wasm",
]);
run(bindgen, [
  "target/wasm32-unknown-unknown/release/opencut_wasm.wasm",
  "--out-dir",
  "dist",
  "--target",
  "web",
]);
writeFileSync(
  resolve(directory, "dist/index.js"),
  'import init from "./opencut_wasm.js";\nexport * from "./opencut_wasm.js";\nlet ready;\nexport function initializeWasm(){return ready??=init({module_or_path:new URL("./opencut_wasm_bg.wasm",import.meta.url).href});}\n',
);
writeFileSync(
  resolve(directory, "dist/index.d.ts"),
  'export * from "./opencut_wasm.js";\nexport declare function initializeWasm():Promise<unknown>;\n',
);
