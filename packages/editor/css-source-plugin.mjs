import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import prefix from "postcss-prefix-selector";
import namespace from "./css-namespace.mjs";
import { prefixOptions } from "./css-prefix.mjs";

const entry = realpathSync(fileURLToPath(new URL("./src/react/style.css", import.meta.url)));

/**
 * For hosts that compile the editor from source: runs the editor's style pipeline
 * (Tailwind -> .bve-scope prefix -> bve- namespace) on the editor's own stylesheet only,
 * and leaves every other stylesheet in the host untouched.
 */
const editorStyles = () => {
  const pipeline = postcss([tailwind(), prefix(prefixOptions), namespace()]);
  return {
    postcssPlugin: "bve-editor-styles",
    async Once(root, { result }) {
      const from = root.source?.input.file;
      if (!from) return;
      let file = from;
      try { file = realpathSync(from); } catch {}
      if (file !== entry) return;
      const out = await pipeline.process(root.source.input.css, { from });
      root.removeAll();
      root.append(out.root.nodes);
      result.messages.push(...out.messages);
    },
  };
};
editorStyles.postcss = true;
export default editorStyles;
