import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "packages/editor/dist");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const lock = readFileSync(resolve(root, "pnpm-lock.yaml"), "utf8");
check(
  !/@radix-ui\/|\bsonner:|@huggingface\/|\btransformers:|\bbetter-auth:|\bdrizzle-orm:/.test(
    lock,
  ),
  "Forbidden UI/service dependency in lockfile",
);
for (const name of readdirSync(dist).filter((name) =>
  /\.(js|map)$/.test(name),
)) {
  const source = readFileSync(resolve(dist, name), "utf8");
  check(
    !/[/\\]opencut[/\\]/.test(source),
    `Original checkout reference: ${name}`,
  );
  check(
    !/@radix-ui\/|from["']sonner["']|@huggingface\/|from["']next\//.test(
      source,
    ),
    `Forbidden runtime import: ${name}`,
  );
}
// A scoped stylesheet cannot style a custom overlay portalled directly to body.
// This boundary previously broke the browser's native media drag session.
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : [file];
  });
}
for (const file of [
  ...sourceFiles(resolve(root, "packages/editor/src")),
  ...sourceFiles(dist),
].filter((file) => /\.(tsx?|js|map)$/.test(file))) {
  check(
    !/\b(?:ScenesManager|ScenesView|SceneSelector|CreateSceneCommand|DeleteSceneCommand|RenameSceneCommand|createScene|deleteScene|renameScene|switchToScene|currentSceneId|TScene)\b|Main scene/.test(
      readFileSync(file, "utf8"),
    ),
    `Removed multi-scene feature remains: ${file}`,
  );
}
for (const file of sourceFiles(resolve(root, "packages/editor/src")).filter(
  (file) => file.endsWith(".tsx"),
)) {
  const source = readFileSync(file, "utf8");
  check(
    !(
      source.includes("createPortal") &&
      /document\.(body|documentElement)/.test(source)
    ),
    `Custom overlay escapes editor portal: ${file}`,
  );
}
const css = postcss.parse(readFileSync(resolve(dist, "style.css"), "utf8"));
css.walkRules((rule) => {
  if (rule.parent.type === "atrule" && rule.parent.name.endsWith("keyframes"))
    return;
  check(
    rule.selector.includes(".bve-scope") || rule.selector.includes("&"),
    `Unscoped CSS: ${rule.selector}`,
  );
});
css.walkDecls((decl) => {
  if (decl.prop.startsWith("--")) check(decl.prop.startsWith("--bve-"), `Unscoped variable declaration: ${decl.prop}`);
});
css.walkAtRules((rule) => {
  if (rule.name === "layer")
    check(false, `Layer must be flattened so host CSS cannot outrank it: ${rule.params}`);
  if (rule.name.endsWith("keyframes"))
    check(rule.params.startsWith("bve-"), `Unscoped animation: ${rule.params}`);
  if (rule.name === "property")
    check(
      rule.params.startsWith("--bve-"),
      `Global CSS property: ${rule.params}`,
    );
});
check(
  existsSync(resolve(dist, "INTER-LICENSE.txt")),
  "Bundled font license missing",
);
check(
  readdirSync(resolve(dist, "assets")).some((name) => name.endsWith(".wasm")),
  "WASM asset missing",
);
check(
  existsSync(resolve(dist, "types/index.d.ts")),
  "Type declarations missing",
);
console.log(
  JSON.stringify(
    {
      passed: failures.length === 0,
      failures,
      checks: [
        "editor portal ownership",
        "single timeline without multi-scene UI, commands or types",
        "dependency lock",
        "runtime checkout/framework imports",
        "CSS selectors/layers/animations/properties",
        "font license",
        "WASM",
        "types",
      ],
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
