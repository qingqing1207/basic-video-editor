import { setFontResolver } from "./resolver";
import type { FontOption } from "./types";
import type { FontProvider } from "@/api/adapters";
import { SYSTEM_FONTS } from "./system-fonts";
import type { Notifications } from "@/core/notifications";
export const FALLBACK_FONT = "Inter";
const bundledFonts = [
  {
    weight: "400",
    url: new URL("../assets/inter-latin-400-normal.woff2", import.meta.url)
      .href,
  },
  {
    weight: "700",
    url: new URL("../assets/inter-latin-700-normal.woff2", import.meta.url)
      .href,
  },
];
export class FontService {
  private destroyed = false;
  private catalog: FontOption[] | null = null;
  private loaded = new Map<string, Promise<void>>();
  private faces = new Set<FontFace>();
  private missing = new Set<string>();
  constructor(
    private provider: FontProvider | undefined,
    private notifications: Notifications,
  ) {
    setFontResolver((family) => this.resolve(family));
  }
  async list() {
    return (this.catalog ??= [
      ...Array.from(SYSTEM_FONTS, (family) => ({
        value: family,
        label: family,
        category: "system" as const,
      })),
      {
        value: FALLBACK_FONT,
        label: FALLBACK_FONT,
        category: "local" as const,
      },
      ...((await this.provider?.list()) ?? []),
    ]);
  }
  async load(family: string) {
    if (SYSTEM_FONTS.has(family)) return;
    if (this.loaded.has(family)) return this.loaded.get(family)!;
    const task = (async () => {
      try {
        let faces: FontFace[] | void;
        if (family === FALLBACK_FONT)
          faces = await Promise.all(
            bundledFonts.map((font) =>
              new FontFace(FALLBACK_FONT, `url(${font.url})`, {
                weight: font.weight,
              }).load(),
            ),
          );
        else {
          if (
            !(await this.list()).some((font) => font.value === family) ||
            !this.provider
          )
            throw new Error("Font is not in the supplied catalog");
          faces = await this.provider.load(family);
        }
        for (const face of faces ?? []) {
          await face.load();
          if (this.destroyed) return;
          document.fonts.add(face);
          this.faces.add(face);
        }
      } catch (error) {
        if (this.destroyed) return;
        this.missing.add(family);
        this.notifications.emit({
          type: "error",
          title: `Font “${family}” unavailable`,
          description: `Using ${FALLBACK_FONT}. ${error instanceof Error ? error.message : String(error)}`,
        });
        if (family !== FALLBACK_FONT) await this.load(FALLBACK_FONT);
        else throw error;
      }
    })();
    this.loaded.set(family, task);
    return task;
  }
  resolve(family: string) {
    return this.missing.has(family) ? FALLBACK_FONT : family;
  }
  async loadMany(families: string[]) {
    await Promise.all(families.map((f) => this.load(f)));
  }
  destroy() {
    this.destroyed = true;
    setFontResolver((family) => family);
    for (const face of this.faces) document.fonts.delete(face);
    this.faces.clear();
    this.loaded.clear();
    this.catalog = null;
  }
}
