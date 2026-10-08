import { Project, Node, SyntaxKind } from "ts-morph";
import fs from "node:fs";
const root = "packages/editor/src";
const blur = fs
  .readFileSync(`${root}/effects/definitions/blur.ts`, "utf8")
  .split("function parseIntensity")[0]
  .replace(
    'import type { EffectDefinition, EffectPass } from "@/effects/types";',
    'import type { BlurPass } from "./types";',
  )
  .replaceAll("EffectPass", "BlurPass");
fs.mkdirSync(`${root}/services/renderer/blur`, { recursive: true });
fs.writeFileSync(`${root}/services/renderer/blur/gaussian.ts`, blur);
fs.writeFileSync(
  `${root}/services/renderer/blur/types.ts`,
  'export type BlurUniformValue = number | number[];\nexport interface BlurPass { shader: "gaussian-blur"; uniforms: Record<string, BlurUniformValue>; }\n',
);
const removedPaths = [
  "effects",
  "animation/effect-param-channel.ts",
  "animation/graphic-param-channel.ts",
  "commands/timeline/element/effects",
  "commands/timeline/element/keyframes/upsert-effect-param-keyframe.ts",
  "commands/timeline/element/keyframes/remove-effect-param-keyframe.ts",
  "services/renderer/effect-preview.ts",
  "services/renderer/nodes/sticker-node.ts",
  "services/renderer/nodes/graphic-node.ts",
  "services/renderer/nodes/effect-layer-node.ts",
];
for (const p of removedPaths)
  fs.rmSync(`${root}/${p}`, { recursive: true, force: true });
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const removedName =
  /^(?:Create)?(?:Sticker|Graphic|Effect)(?:Element|Track)$|^Effect$|^(?:Graphic|Effect)ParamPath$/;
const forbidden = new Set(["sticker", "graphic", "effect"]);
const removedFunctions = new Set([
  "hasElementEffects",
  "buildEffectElement",
  "buildStickerElement",
  "buildGraphicElement",
  "buildClipEffectsTab",
  "buildGraphicTab",
  "buildStandaloneEffectTab",
  "getStickerConfig",
  "getGraphicConfig",
  "getEffectConfig",
]);
for (const s of p.getSourceFiles()) {
  if (!s.getFilePath().includes("/packages/editor/src/")) continue;
  let text = s
    .getFullText()
    .replaceAll(
      "@/effects/definitions/blur",
      "@/services/renderer/blur/gaussian",
    );
  // Rendering-only pass types remain private to the retained background blur.
  text = text.replace(
    /import type \{ EffectPass(?:, EffectUniformValue)? \} from "@\/effects\/types";/g,
    'import type { BlurPass as EffectPass, BlurUniformValue as EffectUniformValue } from "@/services/renderer/blur/types";',
  );
  s.replaceWithText(text);
  for (const d of s.getImportDeclarations()) {
    const spec = d.getModuleSpecifierValue();
    if (/^@\/(effects|stickers|graphics)(\/|$)/.test(spec)) {
      d.remove();
      continue;
    }
    for (const n of d.getNamedImports())
      if (removedName.test(n.getName())) n.remove();
  }
  for (const f of s.getFunctions())
    if (removedFunctions.has(f.getName())) f.remove();
  for (const n of [...s.getInterfaces(), ...s.getTypeAliases()])
    if (removedName.test(n.getName())) n.remove();
  for (const n of s.getDescendantsOfKind(SyntaxKind.UnionType).reverse()) {
    if (n.wasForgotten()) continue;
    const ts = n.getTypeNodes();
    const keep = ts.filter(
      (t) =>
        !removedName.test(t.getText()) &&
        !forbidden.has(t.getText().replaceAll('"', "").replaceAll("'", "")),
    );
    if (keep.length !== ts.length)
      n.replaceWithText(keep.map((t) => t.getText()).join(" | ") || "never");
  }
  for (const n of s.getDescendantsOfKind(SyntaxKind.CaseClause).reverse())
    if (
      !n.wasForgotten() &&
      forbidden.has(n.getExpression().getText().replaceAll('"', ""))
    )
      n.remove();
  for (const n of s
    .getDescendantsOfKind(SyntaxKind.PropertySignature)
    .reverse())
    if (!n.wasForgotten() && n.getName() === "effects") n.remove();
  for (const n of s
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
    .reverse())
    if (
      !n.wasForgotten() &&
      (n.getName() === "effects" || forbidden.has(n.getName()))
    )
      n.remove();
  for (const n of s.getDescendantsOfKind(SyntaxKind.CallExpression).reverse()) {
    if (n.wasForgotten()) continue;
    if (n.getExpression().getText() === "elementTypes") {
      n.getArguments().forEach((a) => {
        if (forbidden.has(a.getText().replaceAll('"', ""))) n.removeArgument(a);
      });
    }
  }
  // Property panels no longer expose clip effects.
  s.replaceWithText(
    s
      .getFullText()
      .replace(/^\s*buildClipEffectsTab\(\{ element \}\),\n/gm, ""),
  );
}
await p.save();
