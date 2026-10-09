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
    solid: "var(--bve-primary)",
    "solid-foreground": "var(--bve-primary-foreground)",
    "solid-hover": "color-mix(in srgb, var(--bve-primary) 90%, black)",
    "solid-pressed": "color-mix(in srgb, var(--bve-primary) 82%, black)",
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

/** The previous default: page and panels share one color, separated only by hairlines; the primary button flips black <-> white. */
const flat: EditorAppearance = {
  light: { panel: "#ffffff" },
  dark: {
    canvas: "#111113",
    panel: "#111113",
    input: "#18181b",
    popover: "#18181b",
    accent: "#1f1f23",
    solid: "#f4f4f5",
    "solid-foreground": "#18181b",
    "solid-hover": "color-mix(in srgb, #f4f4f5 88%, black)",
    "solid-pressed": "color-mix(in srgb, #f4f4f5 76%, black)",
  },
};

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    label: "极简",
    note: "当前默认：白色页面 + 白色面板（细边框分区，无灰填充；深色：页面最深、面板稍亮），主按钮深色下是深灰；仅编辑提示线为蓝色，轨道保留彩色",
  },
  {
    id: "flat",
    label: "同色面板",
    note: "上一版：页面和面板同色、只靠细线分区，深色主按钮是白色",
    appearance: flat,
  },
  {
    id: "classic",
    label: "旧版",
    note: "改版前的 OpenCut 原样式，仅用于对比",
    appearance: classic,
  },
];
