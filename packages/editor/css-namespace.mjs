const namespace = () => ({
  postcssPlugin: "editor-css-namespace",
  OnceExit(root) {
    // Host CSS outside any @layer always outranks layered CSS regardless of specificity, so a global
    // `button { ... }` in the host would restyle the editor. Flatten the layers: every selector is scoped
    // under .bve-scope, so specificity decides. Layer order still has to hold between rules of equal
    // specificity (utilities must beat component rules), and a layer can appear in several blocks, so the
    // blocks are merged and emitted in the declared order (`@layer theme, base, components, utilities`).
    // Unlayered rules stay after all layered ones, as they did in the cascade.
    const order = [];
    const buckets = new Map();
    const note = (name) => {
      if (!buckets.has(name)) {
        buckets.set(name, []);
        order.push(name);
      }
    };
    for (const node of [...root.nodes]) {
      if (node.type !== "atrule" || node.name !== "layer") continue;
      const names = node.params.split(",").map((name) => name.trim()).filter(Boolean);
      if (!node.nodes) {
        names.forEach(note);
      } else {
        const name = names[0] ?? "";
        note(name);
        buckets.get(name).push(...node.nodes);
      }
      node.remove();
    }
    const layered = order.flatMap((name) => buckets.get(name));
    const unlayered = [...root.nodes];
    root.removeAll();
    root.append(...layered, ...unlayered);
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
