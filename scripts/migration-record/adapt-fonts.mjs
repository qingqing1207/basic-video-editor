import { Project, SyntaxKind as K } from "ts-morph";
import { rm } from "node:fs/promises";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
for (const s of p.getSourceFiles())
  for (const i of s.getImportDeclarations())
    if (i.getModuleSpecifierValue() === "@/fonts/google-fonts")
      i.setModuleSpecifier("@/fonts/local-fonts");
const s = p.getSourceFileOrThrow(
  "packages/editor/src/components/ui/font-picker.tsx",
);
for (const i of s.getImportDeclarations()) {
  if (i.getModuleSpecifierValue() === "@/fonts/types") i.remove();
  else if (i.getModuleSpecifierValue() === "@/fonts/use-font-atlas") {
    i.setModuleSpecifier("@/fonts/use-font-catalog");
    i.getNamedImports()[0].renameAlias("useFontAtlas");
    i.getNamedImports()[0].setName("useFontCatalog");
  }
}
s.getFunction("FontSpritePreview")?.remove();
let text = s
  .getFullText()
  .replace(
    "const { atlas, status, fontNames, retry: handleRetry }",
    "const { status, fontNames, retry: handleRetry }",
  )
  .replace('status === "idle" && atlas &&', 'status === "idle" &&')
  .replace(/\s*atlas,\n/g, "\n")
  .replace(/\s*atlas: FontAtlas;\n/g, "\n")
  .replace(/\s*const entry = atlas.fonts\[fontName\];/, "");
text = text.replace(
  /\{isSystemFont \? \((.*?)\) : \(\s*<FontSpritePreview entry=\{entry\} \/>\s*\)\}/s,
  "$1",
);
s.replaceWithText(text);
const core = p.getSourceFileOrThrow("packages/editor/src/core/index.ts");
core.addImportDeclarations([
  { moduleSpecifier: "@/fonts/service", namedImports: ["FontService"] },
  {
    moduleSpecifier: "./transcription",
    namedImports: ["TranscriptionService"],
  },
]);
const cls = core.getClassOrThrow("EditorCore");
cls.addProperties([
  { name: "fonts", type: "FontService", isReadonly: true },
  { name: "transcription", type: "TranscriptionService", isReadonly: true },
]);
cls
  .getConstructors()[0]
  .insertStatements(
    1,
    "this.fonts=new FontService(options.fonts,this.notifications);this.transcription=new TranscriptionService(options.transcription);",
  );
const caption = p.getSourceFileOrThrow(
  "packages/editor/src/subtitles/components/assets-view.tsx",
);
caption.getImportDeclaration("@/services/transcription/service")?.remove();
caption.replaceWithText(
  caption
    .getFullText()
    .replace(
      "transcriptionService.transcribe",
      "editor.transcription.transcribe",
    )
    .replace(
      "disabled={isProcessing || activeDiagnostics.length > 0}",
      "disabled={isProcessing || activeDiagnostics.length > 0 || !editor.transcription.configured}",
    )
    .replace(
      'isProcessing ? processing.step : "Generate transcript"',
      'isProcessing ? processing.step : editor.transcription.configured ? "Generate transcript" : "Transcription not configured"',
    ),
);
const types = p.getSourceFileOrThrow(
  "packages/editor/src/transcription/types.ts",
);
types.getTypeAlias("TranscriptionModelId")?.remove();
types.getInterface("TranscriptionModel")?.remove();
await p.save();
for (const f of [
  "fonts/google-fonts.ts",
  "fonts/use-font-atlas.ts",
  "transcription/models.ts",
])
  await rm("packages/editor/src/" + f);
