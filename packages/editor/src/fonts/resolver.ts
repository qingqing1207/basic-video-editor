let resolveFamily: (family: string) => string = (family) => family;
export function setFontResolver(resolver: (family: string) => string) {
  resolveFamily = resolver;
}
export function resolveFontFamily(family: string) {
  return resolveFamily(family);
}
