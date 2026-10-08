import { Project, SyntaxKind as K } from "ts-morph";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
let s = p.getSourceFileOrThrow(
  "packages/editor/src/core/managers/project-manager.ts",
);
const manager = s.getClassOrThrow("ProjectManager");
manager
  .getMethodOrThrow("saveCurrentProject")
  .getDescendantsOfKind(K.CatchClause)[0]
  .getBlock()
  .addStatements("throw error;");
manager
  .getMethodOrThrow("createNewProject")
  .insertStatements(0, "this.isLoading=false;this.isInitialized=true;");
s = p.getSourceFileOrThrow(
  "packages/editor/src/core/managers/clipboard-manager.ts",
);
s.getClassOrThrow("ClipboardManager").addMethod({
  name: "clear",
  statements: "this.entry=null;this.notify();",
});
s = p.getSourceFileOrThrow(
  "packages/editor/src/core/managers/playback-manager.ts",
);
const playback = s.getClassOrThrow("PlaybackManager");
playback.addProperty({
  name: "scopeUnsubscribers",
  type: "Array<()=>void>",
  initializer: "[]",
  scope: "private",
});
s.replaceWithText(
  s
    .getFullText()
    .replace(
      "this.editor.timeline.subscribe(reconcile);\n\t\tthis.editor.scenes.subscribe(reconcile);",
      "this.scopeUnsubscribers=[this.editor.timeline.subscribe(reconcile),this.editor.scenes.subscribe(reconcile)];",
    ),
);
s.getClassOrThrow("PlaybackManager").addMethod({
  name: "dispose",
  statements:
    "this.pause();for(const fn of this.scopeUnsubscribers)fn();this.scopeUnsubscribers=[];this.timelineScopeBound=false;this.listeners.clear();this.seekListeners.clear();this.updateListeners.clear();",
});
s = p.getSourceFileOrThrow(
  "packages/editor/src/services/renderer/compositor/wasm-compositor.ts",
);
s.getClassOrThrow("WasmCompositor").addMethod({
  name: "clear",
  statements:
    "for(const id of this.cache.keys())releaseTexture(id);this.cache.clear();this.canvas=null;this.initializedSize=null;",
});
s = p.getSourceFileOrThrow(
  "packages/editor/src/services/renderer/nodes/image-node.ts",
);
s.addFunction({
  name: "clearImageSourceCache",
  isExported: true,
  statements: "imageSourceCache.clear();",
});
s = p.getSourceFileOrThrow("packages/editor/src/core/index.ts");
s.addImportDeclarations([
  {
    moduleSpecifier: "@/services/renderer/nodes/image-node",
    namedImports: ["clearImageSourceCache"],
  },
  {
    moduleSpecifier: "@/services/renderer/compositor/wasm-compositor",
    namedImports: ["wasmCompositor"],
  },
  {
    moduleSpecifier: "@/services/renderer/blur/preview",
    namedImports: ["blurPreviewService"],
  },
  {
    moduleSpecifier: "@/export",
    namedImports: [
      "getExportMimeType",
      { name: "ExportOptions", isTypeOnly: true },
    ],
  },
  {
    moduleSpecifier: "@/media/processing",
    namedImports: ["processMediaAssets"],
  },
]);
const core = s.getClassOrThrow("EditorCore");
core.getMethod("reset")?.remove();
core.addProperties([
  { name: "destroyed", initializer: "false" },
  { name: "activeRoots", initializer: "new Set<HTMLElement>()" },
  {
    name: "operations",
    type: "Promise<unknown>",
    initializer: "Promise.resolve()",
    scope: "private",
  },
]);
core.addMethod({
  name: "ownsEvent",
  parameters: [{ name: "event", type: "Event" }],
  statements:
    "return [...this.activeRoots].some(root=>event.composedPath().includes(root)||root.contains(event.target as Node));",
});
core.addMethod({
  name: "enqueue",
  scope: "private",
  typeParameters: ["T"],
  parameters: [{ name: "run", type: "()=>Promise<T>" }],
  returnType: "Promise<T>",
  statements:
    'if(this.destroyed)return Promise.reject(new Error("Editor is destroyed"));const operation=this.operations.then(run);this.operations=operation.catch(()=>{});return operation;',
});
core.addMethod({
  name: "newProject",
  parameters: [
    { name: "name", type: "string", initializer: '"Untitled project"' },
  ],
  statements:
    "return this.enqueue(async()=>{await this.closeCurrent(false);const id=await this.project.createNewProject({name});this.save.reset();return id;});",
});
core.addMethod({
  name: "openProject",
  parameters: [{ name: "id", type: "string" }],
  statements:
    "return this.enqueue(async()=>{await this.closeCurrent(false);await this.project.loadProject({id});this.save.reset();});",
});
core.addMethod({
  name: "saveProject",
  statements:
    "return this.enqueue(async()=>{this.save.markDirty({force:true});await this.save.flush();});",
});
core.addMethod({
  name: "closeProject",
  parameters: [
    { name: "options", type: "{discard?:boolean}", initializer: "{}" },
  ],
  statements:
    "return this.enqueue(()=>this.closeCurrent(options.discard??false));",
});
core.addMethod({
  name: "closeCurrent",
  isAsync: true,
  scope: "private",
  parameters: [{ name: "discard", type: "boolean" }],
  statements: `this.playback.pause();this.project.cancelExport();this.transcription.cancel();
await this.waitForExport();
if(!discard)await this.save.flush();
this.save.pause();this.project.closeProject();this.command.clear();this.clipboard.clear();this.selection.clearSelection();this.renderer.setRenderTree({renderTree:null});clearImageSourceCache();wasmCompositor.clear();this.save.reset();this.save.resume();`,
});
core.addMethod({
  name: "waitForExport",
  scope: "private",
  returnType: "Promise<void>",
  statements:
    "if(!this.project.getExportState().isExporting)return Promise.resolve();return new Promise(resolve=>{const unsubscribe=this.project.subscribe(()=>{if(!this.project.getExportState().isExporting){unsubscribe();resolve();}});});",
});
core.addMethod({
  name: "importMedia",
  parameters: [{ name: "files", type: "File[]" }],
  statements:
    'return this.enqueue(async()=>{const projectId=this.project.getActive()?.metadata.id;if(!projectId)throw new Error("Open a project first");const processed=await processMediaAssets({files});return Promise.all(processed.map(asset=>this.media.addMediaAsset({projectId,asset})));});',
});
core.addMethod({
  name: "export",
  parameters: [
    { name: "options", type: "ExportOptions" },
    { name: "signal", type: "AbortSignal", hasQuestionToken: true },
  ],
  statements: `return this.enqueue(async()=>{signal?.throwIfAborted();const cancel=()=>this.project.cancelExport();signal?.addEventListener("abort",cancel,{once:true});try{const result=await this.project.export({options});if(result.cancelled)throw new DOMException("Export cancelled","AbortError");if(!result.success||!result.buffer)throw new Error(result.error||"Export failed");return new Blob([result.buffer],{type:getExportMimeType({format:options.format})});}finally{signal?.removeEventListener("abort",cancel);}});`,
});
core.addMethod({
  name: "subscribe",
  parameters: [{ name: "listener", type: "()=>void" }],
  statements:
    "const stops=[this.project.subscribe(listener),this.timeline.subscribe(listener),this.scenes.subscribe(listener),this.media.subscribe(listener),this.playback.subscribe(listener)];return ()=>stops.forEach(stop=>stop());",
});
core.addMethod({
  name: "destroy",
  parameters: [
    { name: "options", type: "{discard?:boolean}", initializer: "{}" },
  ],
  statements: `if(this.destroyed)return Promise.resolve();this.project.cancelExport();this.transcription.cancel();return this.enqueue(async()=>{await this.closeCurrent(options.discard??false);this.save.stop();this.audio.dispose();this.playback.dispose();this.fonts.destroy();blurPreviewService.clear();this.notifications.clear();this.activeRoots.clear();this.destroyed=true;EditorCore.instance=null;});`,
});
await p.save();
