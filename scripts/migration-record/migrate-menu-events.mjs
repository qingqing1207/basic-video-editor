import { Project, SyntaxKind as K } from "ts-morph";
const p = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
for (const s of p.getSourceFiles())
  for (const n of [
    ...s.getDescendantsOfKind(K.JsxSelfClosingElement),
    ...s.getDescendantsOfKind(K.JsxOpeningElement),
  ]) {
    if (
      /^(ContextMenu|DropdownMenu)(Item|CheckboxItem|RadioItem)$/.test(
        n.getTagNameNode().getText(),
      )
    ) {
      let a = n.getAttribute("onSelect");
      if (a) a.setName("onClick");
    }
  }
await p.save();
