import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import {
  editorTokenDefinitions,
  editorTokenGroups,
  editorTokenNames,
} from "@/theme/tokens";

const srcDir = fileURLToPath(new URL("../..", import.meta.url));
const skipped = [
  /(^|\/)__tests__\//,
  /\.test\.tsx?$/,
  /\.d\.ts$/,
  // Artwork and user-content data (brand logos, SVG guide artwork, preset color/gradient libraries).
  /^data\//,
  /^components\/icons\//,
  /^guides\/definitions\//,
];
const sources = (extensions: RegExp) =>
  (readdirSync(srcDir, { recursive: true }) as string[])
    .map((path) => path.split("\\").join("/"))
    .filter(
      (path) => extensions.test(path) && !skipped.some((s) => s.test(path)),
    )
    .map((path) => ({
      path,
      text: readFileSync(join(srcDir, path), "utf8"),
    }));
const scan = (extensions: RegExp, pattern: RegExp, allow: string[] = []) =>
  sources(extensions).flatMap(({ path, text }) =>
    allow.includes(path)
      ? []
      : text.split("\n").flatMap((line, index) => {
          const match = line.match(pattern);
          return match ? [`${path}:${index + 1}  ${match[0]}`] : [];
        }),
  );

const code = /\.tsx?$/;
const palette =
  "black|white|slate|gray|zinc|neutral|stone|red|green|blue|amber|yellow|orange|purple|sky|emerald|teal|cyan|indigo|violet|pink|rose|lime|fuchsia";

describe("theme token system (structure)", () => {
  it("tiers: only the palette carries raw colors; sys/cmp colors alias via var()", () => {
    for (const name of editorTokenNames) {
      const definition = editorTokenDefinitions[name];
      if (definition.kind !== "color") continue;
      for (const mode of ["light", "dark"] as const) {
        const raw = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(
          definition[mode],
        );
        if (definition.tier === "ref")
          expect(raw, `${name} (${mode})`).toBe(true);
        else
          expect(raw, `${name} (${mode}) must reference ref/sys tokens`).toBe(
            false,
          );
      }
    }
  });
  it("ref tokens are prefixed, mode-independent and never reference other tokens", () => {
    for (const name of editorTokenNames) {
      const definition = editorTokenDefinitions[name];
      expect(name.startsWith("ref-"), name).toBe(definition.tier === "ref");
      if (definition.tier === "ref") {
        expect(definition.light).toBe(definition.dark);
        expect(definition.light).not.toContain("var(");
      }
    }
  });
  it("references only point down the tiers (cmp -> sys -> ref), never up", () => {
    const rank = { ref: 0, sys: 1, cmp: 2 } as const;
    for (const name of editorTokenNames) {
      const definition = editorTokenDefinitions[name];
      for (const mode of ["light", "dark"] as const)
        for (const match of definition[mode].matchAll(
          /var\(--bve-([\w-]+)\)/g,
        )) {
          const target =
            editorTokenDefinitions[
              match[1] as keyof typeof editorTokenDefinitions
            ];
          expect(target, `${name} -> ${match[1]}`).toBeDefined();
          expect(
            rank[target.tier],
            `${name} (${definition.tier}) must not reference ${match[1]} (${target.tier})`,
          ).toBeLessThanOrEqual(rank[definition.tier]);
        }
    }
  });
  it("editing cues are driven by the cue token, never by the brand color", () => {
    const cues = [
      "playhead-color",
      "snap-line-color",
      "drop-indicator-color",
      "clip-selected-border",
      "selection-fill",
      "preview-guide-color",
      "preview-selection-color",
    ] as const;
    for (const name of cues)
      for (const mode of ["light", "dark"] as const) {
        const value = editorTokenDefinitions[name][mode];
        expect(value, `${name} (${mode})`).toMatch(/--bve-cue(-fill)?\)/);
        expect(value, `${name} (${mode})`).not.toMatch(
          /--bve-(primary|selected-)/,
        );
      }
  });
  it("every token belongs to a declared group", () => {
    for (const name of editorTokenNames)
      expect(Object.keys(editorTokenGroups)).toContain(
        editorTokenDefinitions[name].group,
      );
  });
});

describe("no hard-coded UI chrome values in source", () => {
  it("does not use Tailwind palette colors (use semantic tokens such as bg-scrim, text-on-media)", () => {
    expect(
      scan(
        code,
        new RegExp(
          `(?<![-\\w])(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow|decoration|placeholder|accent|caret)-(${palette})(-\\d+)?(?![-\\w])`,
        ),
      ),
    ).toEqual([]);
  });
  it("does not use arbitrary color values in class names", () => {
    expect(
      scan(
        code,
        /(?<![-\w])(bg|text|border|ring|fill|stroke|from|to|via|outline|shadow)-\[(#|rgb|hsl)/,
      ),
    ).toEqual([]);
  });
  it("does not use Tailwind default radius / shadow / font-size / z-index scales", () => {
    expect(
      scan(
        code,
        /(?<![-\w])rounded(-(t|r|b|l|tl|tr|bl|br|s|e|ss|se|es|ee))?-(xs|md|lg|xl|2xl|3xl|4xl|\[)/,
      ),
    ).toEqual([]);
    expect(
      scan(code, /(?<![-\w])shadow-(2xs|xs|sm|md|lg|xl|2xl|inner|\[)/),
    ).toEqual([]);
    expect(scan(code, /(?<![-\w])text-\[\d/)).toEqual([]);
    expect(scan(code, /(?<![-\w])z-(\d+|\[)/)).toEqual([]);
  });
  it("does not reach into ref tokens outside the theme folder", () => {
    expect(
      sources(code)
        .filter(({ path }) => !path.startsWith("theme/"))
        .filter(({ text }) => text.includes("--bve-ref-"))
        .map(({ path }) => path),
    ).toEqual([]);
  });
  it("keeps theme CSS free of raw colors and ref references", () => {
    const files = sources(/\.css$/).filter(
      ({ path }) => !path.endsWith(".generated.css"),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const { path, text } of files) {
      const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(stripped, path).not.toMatch(
        /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i,
      );
      expect(stripped, path).not.toContain("--bve-ref-");
    }
  });
  it("does not set raw colors in inline styles outside the allowlisted content editors", () => {
    expect(
      scan(
        code,
        /\b(color|background|backgroundColor|borderColor|borderLeft|boxShadow)\s*:\s*[`"'](#[0-9a-f]|rgb|hsl)/i,
        [
          // User-content colors (default text color, color picker swatches), not UI chrome.
          "timeline/defaults.ts",
          "components/ui/color-picker.tsx",
          "preview/components/text-edit-overlay.tsx",
        ],
      ),
    ).toEqual([]);
  });
});
