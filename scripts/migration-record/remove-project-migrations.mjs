import { Project, SyntaxKind as K } from "ts-morph";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const s = p.getSourceFileOrThrow(
  "packages/editor/src/core/managers/project-manager.ts",
);
for (const i of s.getImportDeclarations())
  if (i.getModuleSpecifierValue().includes("storage/migrations")) i.remove();
s.addImportDeclaration({
  moduleSpecifier: "@/services/storage/service",
  namedImports: ["CURRENT_PROJECT_VERSION"],
});
s.getInterface("MigrationState")?.remove();
const c = s.getClassOrThrow("ProjectManager");
for (const n of ["migrationState", "storageMigrationPromise"])
  c.getProperty(n)?.remove();
for (const n of ["getMigrationState", "ensureStorageMigrations"])
  c.getMethod(n)?.remove();
for (const statement of s.getDescendantsOfKind(K.ExpressionStatement))
  if (statement.getText().includes("await this.ensureStorageMigrations()"))
    statement.remove();
c.getMethodOrThrow("loadAllProjects")
  .setBodyText(`this.isLoading=true;this.notify();
try{this.savedProjects=await this.editor.storage.loadAllProjectsMetadata();}
catch(error){toast.error("Failed to load projects",{description:error instanceof Error?error.message:String(error)});throw error;}
finally{this.isLoading=false;this.isInitialized=true;this.notify();}`);
const core = p.getSourceFileOrThrow("packages/editor/src/core/index.ts");
core.addImportDeclarations([
  {
    moduleSpecifier: "@/api/adapters",
    namedImports: [{ name: "EditorOptions", isTypeOnly: true }],
  },
  {
    moduleSpecifier: "@/browser/repositories",
    namedImports: ["createBrowserRepositories"],
  },
  {
    moduleSpecifier: "@/services/storage/service",
    namedImports: ["StorageService"],
  },
  { moduleSpecifier: "./notifications", namedImports: ["Notifications"] },
]);
const cls = core.getClassOrThrow("EditorCore");
cls.addProperties([
  {
    name: "storage",
    type: "StorageService",
    scope: "public",
    isReadonly: true,
  },
  {
    name: "notifications",
    initializer: "new Notifications()",
    scope: "public",
    isReadonly: true,
  },
  { name: "options", type: "EditorOptions", scope: "public", isReadonly: true },
]);
const ctor = cls.getConstructors()[0];
ctor.addParameter({ name: "options", type: "EditorOptions" });
ctor.insertStatements(
  0,
  `this.options=options;
const defaults=createBrowserRepositories({namespace:options.storageNamespace});
this.storage=new StorageService(options.projects??defaults.projects,options.assets??defaults.assets);`,
);
cls
  .getMethodOrThrow("getInstance")
  .setBodyText(
    'if(!EditorCore.instance)throw new Error("No active editor. Call createEditor() first."); return EditorCore.instance;',
  );
cls.addMethod({
  name: "create",
  isStatic: true,
  parameters: [{ name: "options", type: "EditorOptions", initializer: "{}" }],
  returnType: "EditorCore",
  statements:
    'if(EditorCore.instance)throw new Error("Only one active editor is supported. Destroy the existing instance first."); const instance=new EditorCore(options); EditorCore.instance=instance; return instance;',
});
const save = p.getSourceFileOrThrow(
  "packages/editor/src/core/managers/save-manager.ts",
);
for (const n of save.getDescendantsOfKind(K.IfStatement))
  if (n.getExpression().getText().includes("getMigrationState")) n.remove();
await p.save();
