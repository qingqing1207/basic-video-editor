import { Project, SyntaxKind as K, Node } from "ts-morph";
import { copyFile } from "node:fs/promises";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const layout = p.getSourceFileOrThrow(
  "packages/editor/src/react/editor-layout.tsx",
);
for (const i of layout.getImportDeclarations())
  if (
    /next\/navigation|onboarding|migration-dialog|mobile-gate|changelog|editor-provider/.test(
      i.getModuleSpecifierValue(),
    )
  )
    i.remove();
layout.getFunctionOrThrow("Editor").remove();
layout.getFunctionOrThrow("EditorLayout").setIsExported(true);
layout.getFunctionOrThrow("DegradedRendererBanner").setIsExported(true);
const provider = p.getSourceFileOrThrow(
  "packages/editor/src/components/providers/editor-provider.tsx",
);
provider.getFunctionOrThrow("EditorProvider").remove();
provider.getInterfaceOrThrow("EditorProviderProps").remove();
provider.getFunctionOrThrow("EditorRuntimeBindings").setIsExported(true);
for (const i of provider.getImportDeclarations())
  if (/next|fonts\/local|renderer\/gpu/.test(i.getModuleSpecifierValue()))
    i.remove();
const header = p.getSourceFileOrThrow(
  "packages/editor/src/components/editor/editor-header.tsx",
);
for (const i of header.getImportDeclarations())
  if (
    /next\/(link|navigation)|react-icons|feedback|site\//.test(
      i.getModuleSpecifierValue(),
    )
  )
    i.remove();
header.addStatements(
  'const DEFAULT_LOGO_URL = new URL("../../assets/logo.svg",import.meta.url).href;',
);
for (const n of header.getDescendantsOfKind(K.JsxSelfClosingElement))
  if (n.getTagNameNode().getText() === "FeedbackPopover")
    n.replaceWithText("{null}");
for (const n of header.getDescendantsOfKind(K.JsxElement).reverse())
  if (
    !n.wasForgotten() &&
    n.getOpeningElement().getTagNameNode().getText() === "DropdownMenuItem" &&
    n.getText().includes("SOCIAL_LINKS")
  )
    n.replaceWithText("{null}");
const dd = header.getFunctionOrThrow("ProjectDropdown");
dd.getVariableDeclarationOrThrow("router").getVariableStatement()?.remove();
dd.getVariableDeclarationOrThrow("handleExit").setInitializer(
  `async()=>{if(isExiting)return;setIsExiting(true);try{await editor.closeProject();}catch(error){toast.error("Unable to close project",{description:String(error)});}finally{setIsExiting(false);}}`,
);
header.replaceWithText(
  header
    .getFullText()
    .replace(
      'router.push("/projects");',
      "await editor.closeProject({discard:true});",
    ),
);
const timeline = p.getSourceFileOrThrow(
  "packages/editor/src/timeline/components/timeline-element.tsx",
);
timeline.getFunction("EffectsButton")?.remove();
for (const n of timeline
  .getDescendantsOfKind(K.JsxOpeningElement)
  .concat(timeline.getDescendantsOfKind(K.JsxSelfClosingElement)))
  if (
    !n.wasForgotten() &&
    n.getTagNameNode().getText() === "MediaElementHeader"
  )
    n.getAttribute("leading")?.remove();
for (const s of p.getSourceFiles())
  for (const i of s.getImportDeclarations())
    if (i.getModuleSpecifierValue() === "next/image")
      i.setModuleSpecifier("@/components/ui/media-image");
await p.save();
await copyFile(
  "opencut/apps/web/public/logos/opencut/svg/logo.svg",
  "packages/editor/src/assets/logo.svg",
);
