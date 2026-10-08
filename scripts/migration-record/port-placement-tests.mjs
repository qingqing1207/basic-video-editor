import { Project, SyntaxKind } from "ts-morph";
const project = new Project();
const file = project.addSourceFileAtPath(
  "packages/editor/src/timeline/placement/__tests__/resolve.test.ts",
);
for (const decl of file.getImportDeclarations())
  for (const named of decl.getNamedImports())
    if (named.getName().startsWith("Graphic")) named.remove();
for (const node of file.getDescendantsOfKind(SyntaxKind.CaseClause).reverse())
  if (node.getExpression().getText() === '"graphic"') node.remove();
for (const fn of file.getFunctions())
  for (const overload of fn.getOverloads())
    if (overload.getText().includes('"graphic"')) overload.remove();
const alias = file.getTypeAliasOrThrow("BuildTrackParams");
alias.setType(
  alias
    .getTypeNode()
    .getTypeNodes()
    .filter((t) => !t.getText().includes('"graphic"'))
    .map((t) => t.getText())
    .join(" | "),
);
file
  .getTypeAliasOrThrow("TestElement")
  .setType("AudioElement | TextElement | VideoElement");
// Use retained text overlays for the two generic placement cases formerly using graphics.
file.replaceWithText(
  file
    .getFullText()
    .replaceAll('"graphic"', '"text"')
    .replaceAll("graphic-1", "text-overlay")
    .replace("ticks: startTime", "ticks: startTime * 120000")
    .replace("ticks: duration", "ticks: duration * 120000"),
);
await project.save();
