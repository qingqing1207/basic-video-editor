/**
 * Single source of truth for the theme. Generated from this file:
 *   - theme/tokens.generated.css  (CSS defaults, light/dark/density blocks)
 *   - theme/tailwind.generated.css (Tailwind utility mapping)
 *   - docs/theme-tokens.md
 *
 * Three tiers (see docs/theme.md):
 *   ref  primitive palette. Raw values only; never used by components.
 *   sys  semantic roles (surface, action, status, type, shape, metrics...). Hosts override these.
 *   cmp  component/feature tokens (timeline, preview, slider...). Alias sys (or ref hues) via var().
 * Raw color values may only appear in `ref`; references only point downward (cmp -> sys -> ref).
 */
export const editorTokenGroups = {
  palette: {
    tier: "ref",
    title: "色板",
    hint: "原始色值。sys 层引用它们；宿主一般不直接覆盖，也不要在组件里直接使用",
  },
  surface: {
    tier: "sys",
    title: "表面与文字",
    hint: "画布、背景、面板、边框、文字、输入框、弹层",
  },
  action: {
    tier: "sys",
    title: "品牌与操作",
    hint: "主按钮、次按钮、选中态、焦点环",
  },
  cue: {
    tier: "sys",
    title: "编辑提示色",
    hint: "播放头、吸附线、插入线、选框、预览手柄等编辑器功能性标记；独立于品牌色",
  },
  status: { tier: "sys", title: "状态色", hint: "危险 / 成功 / 警告" },
  media: {
    tier: "sys",
    title: "媒体之上",
    hint: "叠在视频、轨道、画布上的文字、线条与遮罩（不随主题明暗变化）",
  },
  typography: {
    tier: "sys",
    title: "字体与字号",
    hint: "字体族、字号阶梯、行高",
  },
  shape: {
    tier: "sys",
    title: "圆角与边框",
    hint: "圆角阶梯、边框与焦点环宽度",
  },
  metrics: {
    tier: "sys",
    title: "尺寸与间距",
    hint: "控件高度、内边距、间距、图标（comfortable 密度会放大）",
  },
  elevation: {
    tier: "sys",
    title: "阴影、层级与动效",
    hint: "阴影阶梯、z-index 层级、禁用/拖拽透明度、过渡时长",
  },
  timeline: {
    tier: "cmp",
    title: "时间线",
    hint: "轨道、片段、波形、播放头、吸附线、拖放指示（轨道几何尺寸不在此处）",
  },
  preview: {
    tier: "cmp",
    title: "预览画布",
    hint: "选框、手柄、参考线、工作区底色",
  },
  controls: {
    tier: "cmp",
    title: "控件部件",
    hint: "滑块、滚动条等部件尺寸",
  },
} as const;
export type EditorTokenGroup = keyof typeof editorTokenGroups;
export type EditorTokenTier =
  (typeof editorTokenGroups)[EditorTokenGroup]["tier"];

const color = (light: string, dark = light) => ({
  kind: "color" as const,
  light,
  dark,
});
const length = (light: string, comfortable = light) => ({
  kind: "length" as const,
  light,
  dark: light,
  comfortable,
});
const value = (
  kind: "font" | "shadow" | "number" | "time",
  light: string,
  dark = light,
) => ({ kind, light, dark });

type TokenBase = ReturnType<typeof color | typeof length | typeof value>;
const section = <
  G extends EditorTokenGroup,
  D extends Record<string, TokenBase>,
>(
  group: G,
  definitions: D,
) =>
  Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => [
      name,
      { ...definition, group, tier: editorTokenGroups[group].tier },
    ]),
  ) as unknown as {
    [K in keyof D]: D[K] & {
      group: G;
      tier: (typeof editorTokenGroups)[G]["tier"];
    };
  };

const ref = (name: string) => `var(--bve-ref-${name})`;
const sys = (name: string) => `var(--bve-${name})`;
const mix = (name: string, percent: number, into = "transparent") =>
  `color-mix(in srgb, ${name} ${percent}%, ${into})`;

export const editorTokenDefinitions = {
  ...section("palette", {
    "ref-white": color("#ffffff"),
    "ref-black": color("#000000"),
    "ref-neutral-50": color("#fafafa"),
    "ref-neutral-100": color("#f4f4f5"),
    "ref-neutral-150": color("#ececee"),
    "ref-neutral-200": color("#e4e4e7"),
    "ref-neutral-300": color("#d4d4d8"),
    "ref-neutral-400": color("#c4c4cb"),
    "ref-neutral-450": color("#a1a1aa"),
    "ref-neutral-500": color("#8b8b94"),
    "ref-neutral-600": color("#63636b"),
    "ref-neutral-700": color("#3f3f46"),
    "ref-neutral-750": color("#27272a"),
    "ref-neutral-800": color("#1f1f23"),
    "ref-neutral-850": color("#18181b"),
    "ref-neutral-900": color("#141416"),
    "ref-neutral-950": color("#09090b"),
    "ref-blue-400": color("#4db3ff"),
    "ref-blue-600": color("#0d99ff"),
    "ref-red-400": color("#ff7b7b"),
    "ref-red-600": color("#d12c2c"),
    "ref-red-950": color("#3b0b0b"),
    "ref-green-400": color("#4ade80"),
    "ref-green-700": color("#15803d"),
    "ref-green-950": color("#052e16"),
    "ref-amber-400": color("#fbbf24"),
    "ref-amber-700": color("#a65d00"),
    "ref-amber-950": color("#422006"),
    "ref-purple-600": color("#79519e"),
    "ref-teal-600": color("#337d69"),
    "ref-orange-400": color("#ff9a42"),
  }),

  ...section("surface", {
    canvas: color(ref("neutral-100"), ref("neutral-950")),
    background: color(ref("white"), ref("neutral-950")),
    panel: color(ref("white"), ref("neutral-900")),
    foreground: color(ref("neutral-850"), ref("neutral-100")),
    "muted-foreground": color(ref("neutral-600"), ref("neutral-450")),
    "disabled-foreground": color(ref("neutral-450"), ref("neutral-600")),
    muted: color(ref("neutral-300"), ref("neutral-750")),
    accent: color(ref("neutral-150"), ref("neutral-750")),
    "accent-foreground": color(sys("foreground")),
    "pressed-background": color(ref("neutral-200"), ref("neutral-750")),
    border: color(ref("neutral-200"), ref("neutral-750")),
    "border-strong": color(ref("neutral-400"), ref("neutral-700")),
    input: color(ref("white"), ref("neutral-800")),
    "input-border": color(ref("neutral-300"), ref("neutral-700")),
    card: color(sys("panel")),
    "card-foreground": color(sys("foreground")),
    popover: color(ref("white"), ref("neutral-800")),
    "popover-hover": color(sys("accent")),
    "popover-foreground": color(sys("foreground")),
    backdrop: color(mix(ref("black"), 28), mix(ref("black"), 56)),
  }),

  ...section("action", {
    primary: color(ref("neutral-850"), ref("neutral-100")),
    "primary-foreground": color(ref("white"), ref("neutral-850")),
    // Large filled buttons. Light follows primary; dark is a calm gray instead of a glaring white block,
    // while small controls (checkbox, switch, slider, active text) keep the high-contrast primary.
    solid: color(sys("primary"), ref("neutral-700")),
    "solid-foreground": color(sys("primary-foreground"), ref("neutral-50")),
    "solid-hover": color(
      mix(sys("solid"), 82, ref("white")),
      mix(sys("solid"), 85, ref("white")),
    ),
    "solid-pressed": color(
      mix(sys("solid"), 68, ref("white")),
      mix(sys("solid"), 76, ref("black")),
    ),
    secondary: color(mix(sys("primary"), 10, sys("panel"))),
    "secondary-border": color("transparent"),
    "secondary-foreground": color(sys("primary")),
    "selected-background": color(mix(sys("primary"), 10)),
    "selected-hover-background": color(mix(sys("primary"), 16)),
    "selected-border": color(sys("primary")),
    ring: color(sys("primary")),
  }),

  ...section("cue", {
    cue: color(ref("blue-600"), ref("blue-400")),
    "cue-fill": color(mix(sys("cue"), 14)),
  }),

  ...section("status", {
    destructive: color(ref("red-600"), ref("red-400")),
    "destructive-foreground": color(ref("white"), ref("red-950")),
    constructive: color(ref("green-700"), ref("green-400")),
    "constructive-foreground": color(ref("white"), ref("green-950")),
    caution: color(ref("amber-700"), ref("amber-400")),
    "caution-foreground": color(ref("white"), ref("amber-950")),
  }),

  ...section("media", {
    "on-media": color(ref("white")),
    "media-backdrop": color(ref("black")),
    scrim: color(mix(ref("black"), 60)),
    "scrim-subtle": color(mix(ref("black"), 35)),
  }),

  ...section("typography", {
    "font-ui": value("font", '"Inter", Arial, sans-serif'),
    "font-mono": value(
      "font",
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    ),
    "font-size": length("14px"),
    "text-2xs": length("11px"),
    "text-xs": length("12px"),
    "text-sm": length("13px"),
    "text-base": length("14px"),
    "text-lg": length("16px"),
    "text-xl": length("20px"),
    "line-height": value("number", "1.5"),
  }),

  ...section("shape", {
    "radius-sm": length("4px"),
    "radius-control": length("6px"),
    "radius-panel": length("8px"),
    "radius-overlay": length("8px"),
    "border-width": length("1px"),
    "focus-width": length("2px"),
    "focus-offset": length("2px"),
  }),

  ...section("metrics", {
    "control-height-sm": length("28px", "32px"),
    "control-height-md": length("32px", "36px"),
    "control-height": length("36px", "40px"),
    "control-height-lg": length("40px", "44px"),
    "control-padding-x": length("12px", "14px"),
    "menu-item-height": length("28px", "32px"),
    "menu-item-padding-y": length("4px"),
    "menu-padding": length("4px", "6px"),
    "panel-padding": length("12px", "16px"),
    "dialog-padding": length("24px", "28px"),
    "field-gap": length("8px", "12px"),
    "layout-gap": length("6px"),
    "layout-inset": length("6px"),
    "section-gap": length("16px", "20px"),
    "icon-size": length("16px"),
  }),

  ...section("elevation", {
    "shadow-panel": value("shadow", "none"),
    "shadow-raised": value(
      "shadow",
      "0 1px 3px rgb(0 0 0 / 14%)",
      "0 1px 3px rgb(0 0 0 / 45%)",
    ),
    "shadow-overlay": value(
      "shadow",
      "0 4px 16px rgb(0 0 0 / 12%)",
      "0 4px 20px rgb(0 0 0 / 40%)",
    ),
    "shadow-dialog": value(
      "shadow",
      "0 12px 36px rgb(0 0 0 / 18%)",
      "0 12px 36px rgb(0 0 0 / 50%)",
    ),
    "shadow-drag": value(
      "shadow",
      "0 20px 40px rgb(0 0 0 / 28%)",
      "0 20px 40px rgb(0 0 0 / 60%)",
    ),
    "z-raised": value("number", "10"),
    "z-sticky": value("number", "20"),
    "z-overlay": value("number", "250"),
    "z-toast": value("number", "300"),
    "z-drag": value("number", "9999"),
    "disabled-opacity": value("number", "0.5"),
    "drag-preview-opacity": value("number", "0.75"),
    "transition-duration": value("time", "120ms"),
  }),

  ...section("timeline", {
    "track-video-background": color(sys("muted")),
    "track-audio-background": color(ref("purple-600")),
    "track-text-background": color(ref("teal-600")),
    "track-label-color": color(sys("on-media")),
    "track-label-font-size": length(sys("text-2xs")),
    "track-label-background": color(sys("scrim-subtle")),
    "waveform-color": color(mix(sys("on-media"), 80)),
    "waveform-overload-color": color(ref("orange-400")),
    "playhead-color": color(sys("cue")),
    "snap-line-color": color(sys("cue")),
    "drop-indicator-color": color(sys("cue")),
    "drop-indicator-width": length("2px"),
    "clip-selected-border": color(sys("cue")),
    "selection-fill": color(sys("cue-fill")),
  }),

  ...section("preview", {
    "preview-handle-fill": color(sys("on-media")),
    "preview-handle-border": color(ref("neutral-850")),
    "preview-guide-color": color(sys("cue")),
    "preview-selection-color": color(sys("cue")),
    "preview-workspace": color(sys("panel")),
  }),

  ...section("controls", {
    "slider-track-size": length("6px"),
    "slider-thumb-size": length("16px", "18px"),
    "scrollbar-size": length("7px"),
  }),
} as const;

export type EditorTokenName = keyof typeof editorTokenDefinitions;
export type EditorThemeTokens = Partial<Record<EditorTokenName, string>>;
export type EditorThemeMode = "light" | "dark";
export type EditorDensity = "compact" | "comfortable";
export interface EditorAppearance {
  base?: EditorThemeTokens;
  light?: EditorThemeTokens;
  dark?: EditorThemeTokens;
}
export const editorTokenNames = Object.keys(
  editorTokenDefinitions,
) as EditorTokenName[];
export const editorTokenVariable = (name: EditorTokenName) => `--bve-${name}`;
/** Does not touch browser globals. Defaults live in generated CSS, allowing static CSS overrides. */
export function getAppearanceStyle(
  appearance: EditorAppearance | undefined,
  mode: EditorThemeMode,
): Record<string, string> {
  const tokens = { ...appearance?.base, ...appearance?.[mode] };
  return Object.fromEntries(
    editorTokenNames.flatMap((name) =>
      tokens[name] === undefined
        ? []
        : [[editorTokenVariable(name), tokens[name]!]],
    ),
  );
}
