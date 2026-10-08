import { Project, SyntaxKind } from "ts-morph";
const project = new Project({
  tsConfigFilePath: "packages/editor/tsconfig.json",
});
for (const file of project.getSourceFiles()) {
  if (!file.getFilePath().includes("/packages/editor/src/")) continue;
  for (const call of file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === "persist")) {
    const options = call.getArguments()[1];
    if (!options || !options.isKind(SyntaxKind.ObjectLiteralExpression))
      continue;
    options.getProperty("migrate")?.remove();
    options.getProperty("version")?.remove();
    options.addPropertyAssignment({ name: "version", initializer: "1" });
    const name = options.getProperty("name");
    if (name?.isKind(SyntaxKind.PropertyAssignment))
      name.setInitializer(
        JSON.stringify(
          "basic-video-editor-v1:" +
            name
              .getInitializer()
              .getText()
              .replaceAll('"', "")
              .replace("opencut-", ""),
        ),
      );
    options.addPropertyAssignment({
      name: "skipHydration",
      initializer: "true",
    });
  }
}
await project.save();
