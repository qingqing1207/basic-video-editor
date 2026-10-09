# 主题 Token 清单

由 `scripts/generate-theme.mjs` 从 `src/theme/tokens.ts` 生成，不要手改。

- appearance 的键为下表变量去掉 `--bve-` 前缀后的名称；颜色均为完整 CSS 颜色值。
- compact 使用默认尺寸，comfortable 仅改变表中注明的控件尺寸，不改变时间线几何。
- “Tailwind”列是该 token 对应的工具类；没有对应工具类的 token 只能通过 `var(--bve-*)` 使用。
- 三层关系：`ref`（原始色板）→ `sys`（语义角色）→ `cmp`（组件 token）。组件代码只允许使用 sys / cmp。

共 143 个 token。

## Ref · 原始色板（31）

原始色值，只被 sys 层引用。组件与宿主样式不要直接使用。

### 色板

原始色值。sys 层引用它们；宿主一般不直接覆盖，也不要在组件里直接使用

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-ref-white` | color | `#ffffff` | 同浅色 | — | — |
| `--bve-ref-black` | color | `#000000` | 同浅色 | — | — |
| `--bve-ref-neutral-50` | color | `#fafafa` | 同浅色 | — | — |
| `--bve-ref-neutral-100` | color | `#f4f4f5` | 同浅色 | — | — |
| `--bve-ref-neutral-150` | color | `#ececee` | 同浅色 | — | — |
| `--bve-ref-neutral-200` | color | `#e4e4e7` | 同浅色 | — | — |
| `--bve-ref-neutral-300` | color | `#d4d4d8` | 同浅色 | — | — |
| `--bve-ref-neutral-400` | color | `#c4c4cb` | 同浅色 | — | — |
| `--bve-ref-neutral-450` | color | `#a1a1aa` | 同浅色 | — | — |
| `--bve-ref-neutral-500` | color | `#8b8b94` | 同浅色 | — | — |
| `--bve-ref-neutral-600` | color | `#63636b` | 同浅色 | — | — |
| `--bve-ref-neutral-700` | color | `#3f3f46` | 同浅色 | — | — |
| `--bve-ref-neutral-750` | color | `#27272a` | 同浅色 | — | — |
| `--bve-ref-neutral-800` | color | `#1f1f23` | 同浅色 | — | — |
| `--bve-ref-neutral-850` | color | `#18181b` | 同浅色 | — | — |
| `--bve-ref-neutral-900` | color | `#141416` | 同浅色 | — | — |
| `--bve-ref-neutral-950` | color | `#09090b` | 同浅色 | — | — |
| `--bve-ref-blue-400` | color | `#4db3ff` | 同浅色 | — | — |
| `--bve-ref-blue-600` | color | `#0d99ff` | 同浅色 | — | — |
| `--bve-ref-red-400` | color | `#ff7b7b` | 同浅色 | — | — |
| `--bve-ref-red-600` | color | `#d12c2c` | 同浅色 | — | — |
| `--bve-ref-red-950` | color | `#3b0b0b` | 同浅色 | — | — |
| `--bve-ref-green-400` | color | `#4ade80` | 同浅色 | — | — |
| `--bve-ref-green-700` | color | `#15803d` | 同浅色 | — | — |
| `--bve-ref-green-950` | color | `#052e16` | 同浅色 | — | — |
| `--bve-ref-amber-400` | color | `#fbbf24` | 同浅色 | — | — |
| `--bve-ref-amber-700` | color | `#a65d00` | 同浅色 | — | — |
| `--bve-ref-amber-950` | color | `#422006` | 同浅色 | — | — |
| `--bve-ref-purple-600` | color | `#79519e` | 同浅色 | — | — |
| `--bve-ref-teal-600` | color | `#337d69` | 同浅色 | — | — |
| `--bve-ref-orange-400` | color | `#ff9a42` | 同浅色 | — | — |

## Sys · 语义角色（90）

表面、操作、状态、字体、形状、尺寸、层级。宿主定制主题时覆盖这一层。

### 表面与文字

画布、背景、面板、边框、文字、输入框、弹层

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-canvas` | color | `var(--bve-ref-neutral-100)` | `var(--bve-ref-neutral-950)` | — | `bg-/text-/border-canvas` |
| `--bve-background` | color | `var(--bve-ref-white)` | `var(--bve-ref-neutral-950)` | — | `bg-/text-/border-background` |
| `--bve-panel` | color | `var(--bve-ref-white)` | `var(--bve-ref-neutral-900)` | — | `bg-/text-/border-panel` |
| `--bve-foreground` | color | `var(--bve-ref-neutral-850)` | `var(--bve-ref-neutral-100)` | — | `bg-/text-/border-foreground` |
| `--bve-muted-foreground` | color | `var(--bve-ref-neutral-600)` | `var(--bve-ref-neutral-450)` | — | `bg-/text-/border-muted-foreground` |
| `--bve-disabled-foreground` | color | `var(--bve-ref-neutral-450)` | `var(--bve-ref-neutral-600)` | — | `bg-/text-/border-disabled-foreground` |
| `--bve-muted` | color | `var(--bve-ref-neutral-300)` | `var(--bve-ref-neutral-750)` | — | `bg-/text-/border-muted` |
| `--bve-accent` | color | `var(--bve-ref-neutral-150)` | `var(--bve-ref-neutral-750)` | — | `bg-/text-/border-accent` |
| `--bve-accent-foreground` | color | `var(--bve-foreground)` | 同浅色 | — | `bg-/text-/border-accent-foreground` |
| `--bve-pressed-background` | color | `var(--bve-ref-neutral-200)` | `var(--bve-ref-neutral-750)` | — | `bg-/text-/border-pressed-background` |
| `--bve-border` | color | `var(--bve-ref-neutral-200)` | `var(--bve-ref-neutral-750)` | — | `bg-/text-/border-border` |
| `--bve-border-strong` | color | `var(--bve-ref-neutral-400)` | `var(--bve-ref-neutral-700)` | — | `bg-/text-/border-border-strong` |
| `--bve-input` | color | `var(--bve-ref-white)` | `var(--bve-ref-neutral-800)` | — | `bg-/text-/border-input` |
| `--bve-input-border` | color | `var(--bve-ref-neutral-300)` | `var(--bve-ref-neutral-700)` | — | `bg-/text-/border-input-border` |
| `--bve-card` | color | `var(--bve-panel)` | 同浅色 | — | `bg-/text-/border-card` |
| `--bve-card-foreground` | color | `var(--bve-foreground)` | 同浅色 | — | `bg-/text-/border-card-foreground` |
| `--bve-popover` | color | `var(--bve-ref-white)` | `var(--bve-ref-neutral-800)` | — | `bg-/text-/border-popover` |
| `--bve-popover-hover` | color | `var(--bve-accent)` | 同浅色 | — | `bg-/text-/border-popover-hover` |
| `--bve-popover-foreground` | color | `var(--bve-foreground)` | 同浅色 | — | `bg-/text-/border-popover-foreground` |
| `--bve-backdrop` | color | `color-mix(in srgb, var(--bve-ref-black) 28%, transparent)` | `color-mix(in srgb, var(--bve-ref-black) 56%, transparent)` | — | `bg-/text-/border-backdrop` |

### 品牌与操作

主按钮、次按钮、选中态、焦点环

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-primary` | color | `var(--bve-ref-neutral-850)` | `var(--bve-ref-neutral-100)` | — | `bg-/text-/border-primary` |
| `--bve-primary-foreground` | color | `var(--bve-ref-white)` | `var(--bve-ref-neutral-850)` | — | `bg-/text-/border-primary-foreground` |
| `--bve-solid` | color | `var(--bve-primary)` | `var(--bve-ref-neutral-700)` | — | `bg-/text-/border-solid` |
| `--bve-solid-foreground` | color | `var(--bve-primary-foreground)` | `var(--bve-ref-neutral-50)` | — | `bg-/text-/border-solid-foreground` |
| `--bve-solid-hover` | color | `color-mix(in srgb, var(--bve-solid) 82%, var(--bve-ref-white))` | `color-mix(in srgb, var(--bve-solid) 85%, var(--bve-ref-white))` | — | `bg-/text-/border-solid-hover` |
| `--bve-solid-pressed` | color | `color-mix(in srgb, var(--bve-solid) 68%, var(--bve-ref-white))` | `color-mix(in srgb, var(--bve-solid) 76%, var(--bve-ref-black))` | — | `bg-/text-/border-solid-pressed` |
| `--bve-secondary` | color | `color-mix(in srgb, var(--bve-primary) 10%, var(--bve-panel))` | 同浅色 | — | `bg-/text-/border-secondary` |
| `--bve-secondary-border` | color | `transparent` | 同浅色 | — | `bg-/text-/border-secondary-border` |
| `--bve-secondary-foreground` | color | `var(--bve-primary)` | 同浅色 | — | `bg-/text-/border-secondary-foreground` |
| `--bve-selected-background` | color | `color-mix(in srgb, var(--bve-primary) 10%, transparent)` | 同浅色 | — | `bg-/text-/border-selected-background` |
| `--bve-selected-hover-background` | color | `color-mix(in srgb, var(--bve-primary) 16%, transparent)` | 同浅色 | — | `bg-/text-/border-selected-hover-background` |
| `--bve-selected-border` | color | `var(--bve-primary)` | 同浅色 | — | `bg-/text-/border-selected-border` |
| `--bve-ring` | color | `var(--bve-primary)` | 同浅色 | — | `bg-/text-/border-ring` |

### 编辑提示色

播放头、吸附线、插入线、选框、预览手柄等编辑器功能性标记；独立于品牌色

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-cue` | color | `var(--bve-ref-blue-600)` | `var(--bve-ref-blue-400)` | — | `bg-/text-/border-cue` |
| `--bve-cue-fill` | color | `color-mix(in srgb, var(--bve-cue) 14%, transparent)` | 同浅色 | — | `bg-/text-/border-cue-fill` |

### 状态色

危险 / 成功 / 警告

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-destructive` | color | `var(--bve-ref-red-600)` | `var(--bve-ref-red-400)` | — | `bg-/text-/border-destructive` |
| `--bve-destructive-foreground` | color | `var(--bve-ref-white)` | `var(--bve-ref-red-950)` | — | `bg-/text-/border-destructive-foreground` |
| `--bve-constructive` | color | `var(--bve-ref-green-700)` | `var(--bve-ref-green-400)` | — | `bg-/text-/border-constructive` |
| `--bve-constructive-foreground` | color | `var(--bve-ref-white)` | `var(--bve-ref-green-950)` | — | `bg-/text-/border-constructive-foreground` |
| `--bve-caution` | color | `var(--bve-ref-amber-700)` | `var(--bve-ref-amber-400)` | — | `bg-/text-/border-caution` |
| `--bve-caution-foreground` | color | `var(--bve-ref-white)` | `var(--bve-ref-amber-950)` | — | `bg-/text-/border-caution-foreground` |

### 媒体之上

叠在视频、轨道、画布上的文字、线条与遮罩（不随主题明暗变化）

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-on-media` | color | `var(--bve-ref-white)` | 同浅色 | — | `bg-/text-/border-on-media` |
| `--bve-media-backdrop` | color | `var(--bve-ref-black)` | 同浅色 | — | `bg-/text-/border-media-backdrop` |
| `--bve-scrim` | color | `color-mix(in srgb, var(--bve-ref-black) 60%, transparent)` | 同浅色 | — | `bg-/text-/border-scrim` |
| `--bve-scrim-subtle` | color | `color-mix(in srgb, var(--bve-ref-black) 35%, transparent)` | 同浅色 | — | `bg-/text-/border-scrim-subtle` |

### 字体与字号

字体族、字号阶梯、行高

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-font-ui` | font | `"Inter", Arial, sans-serif` | 同浅色 | — | `font-sans` |
| `--bve-font-mono` | font | `ui-monospace, SFMono-Regular, Menlo, monospace` | 同浅色 | — | `font-mono` |
| `--bve-font-size` | length | `14px` | 同浅色 | — | — |
| `--bve-text-2xs` | length | `11px` | 同浅色 | — | `text-2xs` |
| `--bve-text-xs` | length | `12px` | 同浅色 | — | `text-xs` |
| `--bve-text-sm` | length | `13px` | 同浅色 | — | `text-sm` |
| `--bve-text-base` | length | `14px` | 同浅色 | — | `text-base` |
| `--bve-text-lg` | length | `16px` | 同浅色 | — | `text-lg` |
| `--bve-text-xl` | length | `20px` | 同浅色 | — | `text-xl` |
| `--bve-line-height` | number | `1.5` | 同浅色 | — | — |

### 圆角与边框

圆角阶梯、边框与焦点环宽度

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-radius-sm` | length | `4px` | 同浅色 | — | `rounded-sm` |
| `--bve-radius-control` | length | `6px` | 同浅色 | — | `rounded-control` |
| `--bve-radius-panel` | length | `8px` | 同浅色 | — | `rounded-panel` |
| `--bve-radius-overlay` | length | `8px` | 同浅色 | — | `rounded-overlay` |
| `--bve-border-width` | length | `1px` | 同浅色 | — | — |
| `--bve-focus-width` | length | `2px` | 同浅色 | — | — |
| `--bve-focus-offset` | length | `2px` | 同浅色 | — | — |

### 尺寸与间距

控件高度、内边距、间距、图标（comfortable 密度会放大）

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-control-height-sm` | length | `28px` | 同浅色 | `32px` | — |
| `--bve-control-height-md` | length | `32px` | 同浅色 | `36px` | — |
| `--bve-control-height` | length | `36px` | 同浅色 | `40px` | — |
| `--bve-control-height-lg` | length | `40px` | 同浅色 | `44px` | — |
| `--bve-control-padding-x` | length | `12px` | 同浅色 | `14px` | — |
| `--bve-menu-item-height` | length | `28px` | 同浅色 | `32px` | — |
| `--bve-menu-item-padding-y` | length | `4px` | 同浅色 | — | — |
| `--bve-menu-padding` | length | `4px` | 同浅色 | `6px` | — |
| `--bve-panel-padding` | length | `12px` | 同浅色 | `16px` | — |
| `--bve-dialog-padding` | length | `24px` | 同浅色 | `28px` | — |
| `--bve-field-gap` | length | `8px` | 同浅色 | `12px` | — |
| `--bve-layout-gap` | length | `6px` | 同浅色 | — | — |
| `--bve-layout-inset` | length | `6px` | 同浅色 | — | — |
| `--bve-section-gap` | length | `16px` | 同浅色 | `20px` | — |
| `--bve-icon-size` | length | `16px` | 同浅色 | — | — |

### 阴影、层级与动效

阴影阶梯、z-index 层级、禁用/拖拽透明度、过渡时长

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-shadow-panel` | shadow | `none` | 同浅色 | — | `shadow-panel` |
| `--bve-shadow-raised` | shadow | `0 1px 3px rgb(0 0 0 / 14%)` | `0 1px 3px rgb(0 0 0 / 45%)` | — | `shadow-raised` |
| `--bve-shadow-overlay` | shadow | `0 4px 16px rgb(0 0 0 / 12%)` | `0 4px 20px rgb(0 0 0 / 40%)` | — | `shadow-overlay` |
| `--bve-shadow-dialog` | shadow | `0 12px 36px rgb(0 0 0 / 18%)` | `0 12px 36px rgb(0 0 0 / 50%)` | — | `shadow-dialog` |
| `--bve-shadow-drag` | shadow | `0 20px 40px rgb(0 0 0 / 28%)` | `0 20px 40px rgb(0 0 0 / 60%)` | — | `shadow-drag` |
| `--bve-z-raised` | number | `10` | 同浅色 | — | `z-raised` |
| `--bve-z-sticky` | number | `20` | 同浅色 | — | `z-sticky` |
| `--bve-z-overlay` | number | `250` | 同浅色 | — | `z-overlay` |
| `--bve-z-toast` | number | `300` | 同浅色 | — | `z-toast` |
| `--bve-z-drag` | number | `9999` | 同浅色 | — | `z-drag` |
| `--bve-disabled-opacity` | number | `0.5` | 同浅色 | — | — |
| `--bve-drag-preview-opacity` | number | `0.75` | 同浅色 | — | — |
| `--bve-transition-duration` | time | `120ms` | 同浅色 | — | — |

## Cmp · 组件 token（22）

时间线、预览、控件部件。只通过 var() 引用 sys，不含原始值。

### 时间线

轨道、片段、波形、播放头、吸附线、拖放指示（轨道几何尺寸不在此处）

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-track-video-background` | color | `var(--bve-muted)` | 同浅色 | — | `bg-/text-/border-track-video-background` |
| `--bve-track-audio-background` | color | `var(--bve-ref-purple-600)` | 同浅色 | — | `bg-/text-/border-track-audio-background` |
| `--bve-track-text-background` | color | `var(--bve-ref-teal-600)` | 同浅色 | — | `bg-/text-/border-track-text-background` |
| `--bve-track-label-color` | color | `var(--bve-on-media)` | 同浅色 | — | `bg-/text-/border-track-label-color` |
| `--bve-track-label-font-size` | length | `var(--bve-text-2xs)` | 同浅色 | — | — |
| `--bve-track-label-background` | color | `var(--bve-scrim-subtle)` | 同浅色 | — | `bg-/text-/border-track-label-background` |
| `--bve-waveform-color` | color | `color-mix(in srgb, var(--bve-on-media) 80%, transparent)` | 同浅色 | — | `bg-/text-/border-waveform-color` |
| `--bve-waveform-overload-color` | color | `var(--bve-ref-orange-400)` | 同浅色 | — | `bg-/text-/border-waveform-overload-color` |
| `--bve-playhead-color` | color | `var(--bve-cue)` | 同浅色 | — | `bg-/text-/border-playhead-color` |
| `--bve-snap-line-color` | color | `var(--bve-cue)` | 同浅色 | — | `bg-/text-/border-snap-line-color` |
| `--bve-drop-indicator-color` | color | `var(--bve-cue)` | 同浅色 | — | `bg-/text-/border-drop-indicator-color` |
| `--bve-drop-indicator-width` | length | `2px` | 同浅色 | — | — |
| `--bve-clip-selected-border` | color | `var(--bve-cue)` | 同浅色 | — | `bg-/text-/border-clip-selected-border` |
| `--bve-selection-fill` | color | `var(--bve-cue-fill)` | 同浅色 | — | `bg-/text-/border-selection-fill` |

### 预览画布

选框、手柄、参考线、工作区底色

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-preview-handle-fill` | color | `var(--bve-on-media)` | 同浅色 | — | `bg-/text-/border-preview-handle-fill` |
| `--bve-preview-handle-border` | color | `var(--bve-ref-neutral-850)` | 同浅色 | — | `bg-/text-/border-preview-handle-border` |
| `--bve-preview-guide-color` | color | `var(--bve-cue)` | 同浅色 | — | `bg-/text-/border-preview-guide-color` |
| `--bve-preview-selection-color` | color | `var(--bve-cue)` | 同浅色 | — | `bg-/text-/border-preview-selection-color` |
| `--bve-preview-workspace` | color | `var(--bve-panel)` | 同浅色 | — | `bg-/text-/border-preview-workspace` |

### 控件部件

滑块、滚动条等部件尺寸

| 变量 | 类型 | 浅色默认 | 深色默认 | comfortable | Tailwind |
| --- | --- | --- | --- | --- | --- |
| `--bve-slider-track-size` | length | `6px` | 同浅色 | — | — |
| `--bve-slider-thumb-size` | length | `16px` | 同浅色 | `18px` | — |
| `--bve-scrollbar-size` | length | `7px` | 同浅色 | — | — |
