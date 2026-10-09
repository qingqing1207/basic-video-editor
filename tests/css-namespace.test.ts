import { describe, expect, it } from "vitest";
import postcss from "postcss";
// @ts-expect-error plain ESM plugin without type declarations
import namespace from "../packages/editor/css-namespace.mjs";

const run = async (css: string) => (await postcss([namespace()]).process(css, { from: undefined })).css;
const selectors = (css: string) => [...css.matchAll(/(\.[\w-]+)\s*\{/g)].map((m) => m[1]);

describe("css namespace plugin: @layer flattening", () => {
  it("removes every @layer so host CSS outside layers cannot outrank the editor by being unlayered", async () => {
    const out = await run("@layer theme, base, components, utilities;\n@layer base{.a{color:red}}");
    expect(out).not.toContain("@layer");
  });

  it("keeps the declared layer order even when a layer appears in several blocks, utilities last", async () => {
    // Mirrors the editor build: utilities are emitted first, then theme/components.css adds a
    // second `components` block. Equal-specificity utilities (pl-8) must still beat components.
    const out = await run(`
      @layer theme, base, components, utilities;
      @layer base { .base { color: black } }
      @layer utilities { .pl-8 { padding-left: 2rem } }
      @layer components { .bve-menu-item { padding: 4px 12px } }
      @layer components { .bve-control { font-size: 13px } }
      @layer theme { .theme { --x: 1 } }
    `);
    expect(selectors(out)).toEqual([".theme", ".base", ".bve-menu-item", ".bve-control", ".pl-8"]);
  });

  it("keeps unlayered rules after all layered rules, as the cascade ranks them", async () => {
    const out = await run("@layer utilities{.u{color:red}} .unlayered{color:blue} @layer base{.b{color:green}}");
    expect(selectors(out)).toEqual([".b", ".u", ".unlayered"]);
  });
});
