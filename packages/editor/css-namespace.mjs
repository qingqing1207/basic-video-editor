const namespace = () => ({
  postcssPlugin: "editor-css-namespace",
  OnceExit(root) {
    // Host CSS outside any @layer always outranks layered CSS regardless of specificity, so a global
    // `button { ... }` in the host would restyle the editor. Flatten the layers: Tailwind already emits
    // them in cascade order and every selector is scoped under .bve-scope, so specificity decides.
    root.walkAtRules("layer", (rule) => {
      if (rule.nodes?.length) rule.replaceWith(rule.nodes);
      else rule.remove();
    });
    const animations = new Map();
    root.walkAtRules("keyframes", (rule) => {
      const name = rule.params;
      const scoped = `bve-${name}`;
      animations.set(name, scoped);
      rule.params = scoped;
    });
    root.walkDecls((decl) => {
      if (
        decl.prop === "animation" ||
        decl.prop === "animation-name" ||
        decl.prop.startsWith("--animate-")
      ) {
        decl.value = decl.value.replace(
          /[\w-]+/g,
          (token) => animations.get(token) ?? token,
        );
      }
    });
    root.walkDecls((decl) => {
      if (decl.prop.startsWith("--tw-"))
        decl.prop = decl.prop.replace("--tw-", "--bve-tw-");
      decl.value = decl.value.replaceAll("--tw-", "--bve-tw-");
    });
    root.walkAtRules("property", (rule) => {
      rule.params = rule.params.replace("--tw-", "--bve-tw-");
    });
    // Tailwind also emits --spacing, --color-*, --container-* etc.
    // Namespace declared internals, leaving Base UI's runtime geometry vars alone.
    const variables = new Map();
    root.walkDecls((decl) => {
      if (decl.prop.startsWith("--") && !decl.prop.startsWith("--bve-"))
        variables.set(decl.prop, `--bve-internal-${decl.prop.slice(2)}`);
    });
    root.walkDecls((decl) => {
      decl.prop = variables.get(decl.prop) ?? decl.prop;
      decl.value = decl.value.replace(/--[\w-]+/g, (name) => variables.get(name) ?? name);
    });
    root.walkAtRules("property", (rule) => {
      rule.params = variables.get(rule.params) ?? rule.params;
    });
  },
});
namespace.postcss = true;
export default namespace;
