import { Project, SyntaxKind } from "ts-morph";
const project = new Project({
  tsConfigFilePath: "packages/editor/tsconfig.json",
});
const root = "packages/editor/src/";
const types = project.getSourceFileOrThrow(root + "timeline/types.ts");
types.getInterfaceOrThrow("LibraryAudioElement").remove();
types.getTypeAliasOrThrow("CreateLibraryAudioElement").remove();
types.getTypeAliasOrThrow("AudioElement").setType("UploadAudioElement");
types
  .getTypeAliasOrThrow("CreateAudioElement")
  .setType("CreateUploadAudioElement");
for (const path of ["media/audio.ts", "timeline/element-utils.ts"]) {
  const file = project.getSourceFileOrThrow(root + path);
  for (const decl of file.getImportDeclarations())
    for (const named of decl.getNamedImports())
      if (named.getName().includes("LibraryAudio")) named.remove();
  for (const fn of file.getFunctions())
    if (fn.getName()?.includes("LibraryAudio")) fn.remove();
}
const audio = project.getSourceFileOrThrow(root + "media/audio.ts");
const resolve = audio.getFunctionOrThrow("resolveAudioBufferForElement");
const block = resolve
  .getFirstDescendantByKindOrThrow(SyntaxKind.TryStatement)
  .getTryBlock();
block.replaceWithText(
  `{const asset=mediaMap.get(element.mediaId);if(!asset)return null;return await resolveAudioBufferForAsset({asset,audioContext});}`,
);
for (const node of audio.getDescendantsOfKind(SyntaxKind.IfStatement).reverse())
  if (
    node.getExpression().getText() === 'element.sourceType === "upload"' &&
    node.getElseStatement()
  )
    node.replaceWithText(node.getThenStatement().getText());
const insert = project.getSourceFileOrThrow(
  root + "commands/timeline/element/insert-element.ts",
);
for (const node of insert.getDescendantsOfKind(SyntaxKind.IfStatement))
  if (node.getExpression().getText().includes('"library"')) node.remove();
const timeline = project.getSourceFileOrThrow(
  root + "timeline/components/timeline-element.tsx",
);
for (const node of timeline
  .getDescendantsOfKind(SyntaxKind.ConditionalExpression)
  .reverse()) {
  const condition = node.getCondition().getText();
  if (condition === 'element.sourceType === "upload"')
    node.replaceWithText(node.getWhenTrue().getText());
  else if (condition === 'element.sourceType === "library"')
    node.replaceWithText(node.getWhenFalse().getText());
}
await project.save();
