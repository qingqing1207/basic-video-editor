import { Project, SyntaxKind as K, Node } from "ts-morph";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const banned = /^(StickerDragData|GraphicDragData|EffectDragData)$/;
for (const s of p.getSourceFiles()) {
  if (!s.getFilePath().includes("/packages/editor/src/")) continue;
  for (const n of s.getInterfaces()) if (banned.test(n.getName())) n.remove();
  for (const n of s.getDescendantsOfKind(K.UnionType).reverse())
    if (!n.wasForgotten()) {
      const keep = n.getTypeNodes().filter((t) => !banned.test(t.getText()));
      if (keep.length !== n.getTypeNodes().length)
        n.replaceWithText(keep.map((t) => t.getText()).join(" | "));
    }
  for (const i of s.getImportDeclarations())
    for (const n of i.getNamedImports())
      if (
        /^(buildGraphicElement|buildStickerElement|buildEffectElement|hasElementEffects|buildGraphicParamPath)$/.test(
          n.getName(),
        )
      )
        n.remove();
  for (const c of s.getClasses())
    for (const m of c.getMethods())
      if (/^execute(Sticker|Graphic)Drop$/.test(m.getName())) m.remove();
  for (const f of s.getFunctions())
    if (
      /^(build(Graphic|Effect)ParamDescriptor|(Graphic|Effect|Sticker)ElementContent)$/.test(
        f.getName() || "",
      )
    )
      f.remove();
  for (const n of s.getDescendantsOfKind(K.PropertySignature).reverse())
    if (!n.wasForgotten() && n.getName() === "addClipEffect") n.remove();
  for (const n of s.getDescendantsOfKind(K.PropertyAssignment).reverse())
    if (!n.wasForgotten() && n.getName() === "addClipEffect") n.remove();
}
let s = p.getSourceFileOrThrow(
  "packages/editor/src/timeline/animation-targets.ts",
);
s.getFunctionOrThrow("resolveAnimationTarget").setBodyText(
  "return buildElementParamDescriptor({element, paramKey: path});",
);
s = p.getSourceFileOrThrow(
  "packages/editor/src/components/editor/panels/properties/hooks/use-keyframed-param-property.ts",
);
s.replaceWithText(
  s
    .getFullText()
    .replace("propertyPath?: AnimationPath", "propertyPath: AnimationPath")
    .replace(
      "propertyPath ?? buildGraphicParamPath({ paramKey: param.key })",
      "propertyPath",
    ),
);
s = p.getSourceFileOrThrow(
  "packages/editor/src/commands/timeline/track/add-track.ts",
);
s.getFunctionOrThrow("buildOverlayTrackState")
  .getVariableDeclarationOrThrow("newTrack")
  .setInitializer(
    'trackType === "video" ? buildEmptyTrack({id:trackId,type:"video"}) : buildEmptyTrack({id:trackId,type:"text"})',
  );
s = p.getSourceFileOrThrow(
  "packages/editor/src/services/renderer/compositor/frame-descriptor.ts",
);
s.replaceWithText(
  s.getFullText().replaceAll("node.resolved.effectPasses", "[]"),
);
s = p.getSourceFileOrThrow(
  "packages/editor/src/timeline/placement/insert-index.ts",
);
for (const n of s.getDescendantsOfKind(K.IfStatement))
  if (n.getExpression().getText() === 'trackType === "effect"') n.remove();
await p.save();
