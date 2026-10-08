import { Project, SyntaxKind as K, Node } from "ts-morph";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const forbiddenType =
  /^(StickerNode|GraphicNode|ResolvedGraphicNodeState|EffectLayerNode|ResolvedEffectLayerNodeState)$/;
const removedPath =
  /(?:effects|graphic-param-channel|effect-param-channel|nodes\/(?:sticker|graphic|effect-layer)-node|remove-effect-param-keyframe|upsert-effect-param-keyframe)$/;
for (const s of p.getSourceFiles()) {
  if (!s.getFilePath().includes("/packages/editor/src/")) continue;
  for (const i of [...s.getImportDeclarations(), ...s.getExportDeclarations()])
    if (removedPath.test(i.getModuleSpecifierValue() || "")) i.remove();
  for (const i of s.getImportDeclarations())
    for (const n of i.getNamedImports())
      if (/Effect.*Command|ClipEffect/.test(n.getName())) n.remove();
  for (const c of s.getClasses())
    for (const m of c.getMethods()) if (/Effect/.test(m.getName())) m.remove();
  for (const f of s.getFunctions())
    if (
      /^(resolveEffectPassGroups|resolveStickerNode|resolveGraphicNode|resolveEffectLayerNode)$/.test(
        f.getName() || "",
      )
    )
      f.remove();
  for (const t of s.getDescendantsOfKind(K.UnionType).reverse()) {
    if (t.wasForgotten()) continue;
    const types = t
      .getTypeNodes()
      .filter((n) => !forbiddenType.test(n.getText()));
    if (types.length && types.length !== t.getTypeNodes().length)
      t.replaceWithText(types.map((n) => n.getText()).join(" | "));
  }
  // Simplify only feature-discriminant checks; keep the rest of each condition intact.
  for (const b of s.getDescendantsOfKind(K.BinaryExpression).reverse()) {
    if (b.wasForgotten()) continue;
    const op = b.getOperatorToken().getText();
    if (
      ["===", "!==", "==", "!="].includes(op) &&
      /\.(type|key)$/.test(b.getLeft().getText()) &&
      /^"(sticker|graphic|effect)"$/.test(b.getRight().getText())
    )
      b.replaceWithText(op.includes("!") ? "true" : "false");
    else if (op === "instanceof" && forbiddenType.test(b.getRight().getText()))
      b.replaceWithText("false");
    else if (op === "||" || op === "&&") {
      const l = b.getLeft().getText(),
        r = b.getRight().getText();
      if (op === "||" && (l === "false" || r === "false"))
        b.replaceWithText(l === "false" ? r : l);
      else if (op === "&&" && (l === "true" || r === "true"))
        b.replaceWithText(l === "true" ? r : l);
      else if (
        (op === "&&" && (l === "false" || r === "false")) ||
        (op === "||" && (l === "true" || r === "true"))
      )
        b.replaceWithText(op === "&&" ? "false" : "true");
    }
  }
  for (const cond of s.getDescendantsOfKind(K.ConditionalExpression).reverse())
    if (
      !cond.wasForgotten() &&
      ["true", "false"].includes(cond.getCondition().getText())
    )
      cond.replaceWithText(
        (cond.getCondition().getText() === "true"
          ? cond.getWhenTrue()
          : cond.getWhenFalse()
        ).getText(),
      );
  for (const n of s.getDescendantsOfKind(K.IfStatement).reverse()) {
    if (n.wasForgotten()) continue;
    const cond = n.getExpression().getText();
    if (cond === "false") {
      const alt = n.getElseStatement();
      if (alt) n.replaceWithText(alt.getText());
      else if (Node.isIfStatement(n.getParent())) n.replaceWithText("{}");
      else n.remove();
    }
  }
  for (const n of s.getDescendantsOfKind(K.PropertySignature).reverse())
    if (!n.wasForgotten() && n.getName() === "effectPasses") n.remove();
  for (const n of s.getDescendantsOfKind(K.PropertyAssignment).reverse())
    if (!n.wasForgotten() && n.getName() === "effectPasses") n.remove();
  s.replaceWithText(
    s.getFullText().replace(/^\s*registerDefaultEffects\(\);\n/gm, ""),
  );
}
const path = p.getSourceFileOrThrow("packages/editor/src/animation/path.ts");
path
  .getFunctionOrThrow("isAnimationPath")
  .setBodyText("return isAnimationPropertyPath(propertyPath);");
const factory = p.getSourceFileOrThrow(
  "packages/editor/src/timeline/placement/track-factory.ts",
);
for (const f of factory.getFunctions())
  for (const o of f.getOverloads())
    if (/GraphicTrack|EffectTrack/.test(o.getReturnTypeNode()?.getText() || ""))
      o.remove();
const registry = p.getSourceFileOrThrow(
  "packages/editor/src/params/registry.ts",
);
for (const st of registry.getStatements())
  if (
    Node.isExpressionStatement(st) &&
    /key: "(sticker|graphic|effect)"/.test(st.getText())
  )
    st.remove();
const assets = p.getSourceFileOrThrow(
  "packages/editor/src/components/editor/panels/assets/assets-panel-store.tsx",
);
const removedTabs = [
  "sounds",
  "stickers",
  "effects",
  "transitions",
  "adjustment",
];
for (const a of assets.getDescendantsOfKind(K.ArrayLiteralExpression))
  for (const el of a.getElements().reverse())
    if (removedTabs.includes(el.getText().replaceAll('"', "")))
      a.removeElement(el);
for (const file of [
  assets,
  p.getSourceFileOrThrow(
    "packages/editor/src/components/editor/panels/assets/index.tsx",
  ),
]) {
  for (const prop of file.getDescendantsOfKind(K.PropertyAssignment).reverse())
    if (removedTabs.includes(prop.getName())) prop.remove();
  for (const i of file.getImportDeclarations())
    if (i.getModuleSpecifierValue().startsWith("@/sounds")) i.remove();
}
await p.save();
