import type { EditorAppearance } from "@basic-video-editor/editor";

export interface ThemePreset {
  id: string;
  label: string;
  note: string;
  appearance?: EditorAppearance;
}

const secondaryBorder =
  "color-mix(in srgb, var(--bve-primary) 20%, var(--bve-panel))";

/** The previous (OpenCut-derived) look, kept only for side-by-side comparison. */
const classic: EditorAppearance = {
  base: {
    "radius-sm": "5.6px",
    "radius-control": "10.4px",
    "radius-panel": "10.4px",
    "radius-overlay": "13.12px",
    "layout-gap": "3px",
    "layout-inset": "12px",
    "text-xs": "11.52px",
    "text-sm": "12.64px",
    "text-base": "14.72px",
    "text-lg": "18px",
    "secondary-border": secondaryBorder,
    "primary-hover": "color-mix(in srgb, var(--bve-primary) 90%, black)",
    "primary-pressed": "color-mix(in srgb, var(--bve-primary) 82%, black)",
  },
  light: {
    canvas: "#ffffff",
    background: "#ffffff",
    panel: "#f9fafb",
    foreground: "#212121",
    "muted-foreground": "#707070",
    muted: "#d4d4d4",
    accent: "#eeeeee",
    "pressed-background": "#e2e2e2",
    border: "#dddddd",
    "border-strong": "#b3b3b3",
    input: "#eeeeee",
    "input-border": "#dddddd",
    primary: "#0875b5",
    "primary-foreground": "#ffffff",
    cue: "#0875b5",
  },
  dark: {
    canvas: "#0d0d0d",
    background: "#0d0d0d",
    panel: "#1a1a1a",
    foreground: "#dddddd",
    "muted-foreground": "#a3a3a3",
    muted: "#383838",
    accent: "#292929",
    "pressed-background": "#383838",
    border: "#383838",
    "border-strong": "#5c5c5c",
    input: "#292929",
    "input-border": "#383838",
    popover: "#212121",
    primary: "#38bdf8",
    "primary-foreground": "#082f49",
    cue: "#38bdf8",
  },
};

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    label: "极简",
    note: "当前默认：黑白灰、主色即前景色、小圆角、紧凑间距；仅编辑提示线为蓝色，轨道保留彩色",
  },
  {
    id: "classic",
    label: "旧版",
    note: "改版前的 OpenCut 原样式，仅用于对比",
    appearance: classic,
  },
];
