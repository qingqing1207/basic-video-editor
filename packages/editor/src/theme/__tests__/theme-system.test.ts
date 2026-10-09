import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { EditorThemePreview } from "@/theme/preview";
import {
  editorTokenDefinitions,
  editorTokenNames,
  getAppearanceStyle,
  type EditorAppearance,
} from "@/theme/tokens";

function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
/** Follows var(--bve-*) aliases down to the palette hex. */
function resolve(
  name: keyof typeof editorTokenDefinitions,
  mode: "light" | "dark",
): string {
  const raw = editorTokenDefinitions[name][mode];
  const alias = raw.match(/^var\(--bve-([\w-]+)\)$/);
  if (alias)
    return resolve(alias[1] as keyof typeof editorTokenDefinitions, mode);
  // color-mix(in srgb, <a> N%, <b>) with both operands as token references.
  const mix = raw.match(
    /^color-mix\(in srgb, var\(--bve-([\w-]+)\) (\d+)%, var\(--bve-([\w-]+)\)\)$/,
  );
  if (mix) {
    const first = resolve(mix[1] as keyof typeof editorTokenDefinitions, mode);
    const second = resolve(mix[3] as keyof typeof editorTokenDefinitions, mode);
    const share = Number(mix[2]) / 100;
    const channel = (i: number) =>
      Math.round(
        parseInt(first.slice(i, i + 2), 16) * share +
          parseInt(second.slice(i, i + 2), 16) * (1 - share),
      )
        .toString(16)
        .padStart(2, "0");
    return `#${channel(1)}${channel(3)}${channel(5)}`;
  }
  return raw;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

describe("public theme contracts", () => {
  it("can render the optional gallery on the server without initializing browser media APIs", () => {
    expect(
      renderToString(createElement(EditorThemePreview, { theme: "dark" })),
    ).toContain("data-theme-preview-placeholder");
  });
  it("lets a host retain shared typography while switching and removing mode overrides", () => {
    const appearance: EditorAppearance = {
      base: { "font-ui": "system-ui", primary: "var(--host-brand)" },
      dark: { primary: "#aabbcc" },
    };
    expect(getAppearanceStyle(appearance, "dark")).toEqual({
      "--bve-font-ui": "system-ui",
      "--bve-primary": "#aabbcc",
    });
    expect(getAppearanceStyle(appearance, "light")).toEqual({
      "--bve-font-ui": "system-ui",
      "--bve-primary": "var(--host-brand)",
    });
    expect(getAppearanceStyle(undefined, "light")).toEqual({});
    expect(appearance.base?.primary).toBe("var(--host-brand)");
  });
  it("resolves the shipped token dependency graph without missing aliases or cycles", () => {
    for (const mode of ["light", "dark"] as const) {
      const visit = (name: string, path: string[]) => {
        expect(path, `cycle through ${name}`).not.toContain(name);
        expect(editorTokenNames).toContain(name);
        const value =
          editorTokenDefinitions[name as keyof typeof editorTokenDefinitions][
            mode
          ];
        for (const match of value.matchAll(/var\(--bve-([\w-]+)\)/g))
          visit(match[1], [...path, name]);
      };
      editorTokenNames.forEach((name) => visit(name, []));
    }
  });
  it("keeps text readable on shipped primary buttons and colored tracks in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(
        contrast(resolve("primary", mode), resolve("primary-foreground", mode)),
      ).toBeGreaterThanOrEqual(4.5);
      for (const state of ["solid", "solid-hover", "solid-pressed"] as const)
        expect(
          contrast(resolve(state, mode), resolve("solid-foreground", mode)),
          `${state} (${mode})`,
        ).toBeGreaterThanOrEqual(4.5);
      for (const token of [
        "track-audio-background",
        "track-text-background",
      ] as const)
        expect(
          contrast(resolve(token, mode), resolve("track-label-color", mode)),
        ).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("does not turn arbitrary host properties or timeline geometry into CSS overrides", () => {
    const appearance = {
      base: {
        primary: "#123456",
        "track-height": "200px",
        "--host-secret": "value",
      },
    };
    expect(getAppearanceStyle(appearance, "light")).toEqual({
      "--bve-primary": "#123456",
    });
  });
});
