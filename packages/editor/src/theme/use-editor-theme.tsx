"use client";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  editorTokenDefinitions,
  editorTokenNames,
  editorTokenVariable,
  getAppearanceStyle,
  type EditorAppearance,
  type EditorDensity,
  type EditorThemeMode,
  type EditorTokenName,
} from "./tokens";

type ThemeSnapshot = Partial<Record<EditorTokenName, string>>;
export const ResolvedThemeContext = createContext<ThemeSnapshot>({});
const resolvedTokenNames = editorTokenNames.filter(
  (name) => editorTokenDefinitions[name].tier !== "ref",
);
export function useThemeColor(name: EditorTokenName): string {
  return (
    useContext(ResolvedThemeContext)[name] ?? editorTokenDefinitions[name].light
  );
}

/** Read actual computed colors, including host-local CSS variables and color-mix. */
export function resolveThemeSnapshot(root: HTMLElement): ThemeSnapshot {
  const computed = getComputedStyle(root);
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;contain:strict;height:0;overflow:hidden;";
  root.appendChild(probe);
  try {
    return Object.fromEntries(
      resolvedTokenNames.map((name) => {
        const raw = computed.getPropertyValue(editorTokenVariable(name)).trim();
        const kind = editorTokenDefinitions[name].kind;
        let resolved = raw;
        if (kind === "color") {
          probe.style.color = raw;
          resolved = getComputedStyle(probe).color;
        } else if (kind === "length") {
          probe.style.width = raw;
          resolved = getComputedStyle(probe).width;
        } else if (kind === "font") {
          probe.style.fontFamily = raw;
          resolved = getComputedStyle(probe).fontFamily;
        } else if (kind === "shadow") {
          probe.style.boxShadow = raw;
          resolved = getComputedStyle(probe).boxShadow;
        }
        return [name, resolved];
      }),
    );
  } finally {
    probe.remove();
  }
}

export function useEditorTheme({
  root,
  portal,
  theme,
  appearance,
  density,
  style,
}: {
  root: HTMLElement | null;
  portal: HTMLElement | null;
  theme: EditorThemeMode;
  appearance?: EditorAppearance;
  density: EditorDensity;
  style?: CSSProperties;
}) {
  const serialized = JSON.stringify(getAppearanceStyle(appearance, theme));
  const themeStyle = useMemo(
    () => JSON.parse(serialized) as CSSProperties,
    [serialized],
  );
  const styleKey = JSON.stringify(style);
  const [snapshot, setSnapshot] = useState<ThemeSnapshot>({});
  useLayoutEffect(() => {
    if (!root) return;
    const next = resolveThemeSnapshot(root);
    if (portal) {
      for (const name of resolvedTokenNames)
        portal.style.setProperty(editorTokenVariable(name), next[name]!);
    }
    setSnapshot((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    );
  }, [root, portal, theme, density, serialized, styleKey]);
  return { themeStyle, snapshot };
}
