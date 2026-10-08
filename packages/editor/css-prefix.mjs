export const prefixOptions = {
  prefix: ".bve-scope",
  transform(prefix, selector, prefixed) {
    if (selector.startsWith(".bve-scope")) return selector;
    if (selector.startsWith(".dark")) return ".bve-scope" + selector;
    if (
      selector === ":root" ||
      selector === ":host" ||
      selector === "html" ||
      selector === "body"
    )
      return prefix;
    if (selector.includes("&")) return selector;
    return prefixed;
  },
};
