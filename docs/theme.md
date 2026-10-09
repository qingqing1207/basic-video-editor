# 主题系统

编辑器的颜色、圆角、字号、间距、阴影和层级都由一份 token 清单驱动。宿主通过 `theme`、`density`、`appearance` 三个入参定制外观，不需要额外的 Provider，不用重建编辑器，也不会把主题写进工程 JSON。导入 `@basic-video-editor/editor/style.css` 即可，宿主不需要安装 Tailwind。

- 清单：`packages/editor/src/theme/tokens.ts`（唯一来源）。
- 构建时由 `scripts/generate-theme.mjs` 生成默认 CSS、Tailwind 映射和 [完整 Token 表](theme-tokens.md)。
- 项目列表页是宿主自己的页面，不使用这些 token。

## 使用

```tsx
import { ProjectEditor, type EditorAppearance } from "@basic-video-editor/editor";

const appearance: EditorAppearance = {
  base: {                                  // 明暗都生效
    "font-ui": "system-ui, sans-serif",
    "radius-control": "6px",
    "radius-panel": "10px",
  },
  light: {
    primary: "#d9480f",
    "primary-foreground": "#fff",
    canvas: "#f3f1f6",                     // 页面画布（面板之间的底色）
    panel: "#fff",
  },
  dark: {
    primary: "#ff8a5c",
    "primary-foreground": "#2a0f02",
    foreground: "#eeeaf7",
  },
};

<ProjectEditor projectId={id} theme={mode} appearance={appearance} density="compact" />
```

- `theme`：`light` / `dark`。`VideoEditor` 也可以用 `defaultTheme` + `onThemeChange`，或完全由宿主通过 `theme` 控制。
- `density`：`compact`（默认）或 `comfortable`；只放大控件高度和内边距，不改变时间线几何。
- `appearance`：只需提供少量覆盖。键是 token 名（去掉 `--bve-` 前缀），值是任意 CSS 值，也可以引用宿主的变量，例如 `"var(--my-brand)"`。
- 覆盖优先级：CSS 默认值 → density 预设 → `appearance.base` → `appearance` 当前模式 → 根元素 style 的显式覆盖。
- 静态 CSS 也可以覆盖，写在包 CSS 之后、直接命中根：
  ```css
  .editor-host .bve-scope { --bve-primary: #7045bc; --bve-panel: #faf9fc; }
  ```
- 动态切换请更新 `theme` / `appearance` / `density`。系统不会轮询宿主任意 stylesheet 的变化；只改了一个无关祖先的 class 而没有走主题入口，不保证 Canvas 立即重绘。

## Token 架构（ref → sys → cmp）

Token 分三层，只允许向下引用（cmp → sys → ref）：

| 层 | 内容 | 谁使用 |
| --- | --- | --- |
| `ref` | 原始色板（`--bve-ref-*`，如 `ref-neutral-800`），不随明暗模式变化，是唯一含原始色值的层 | 只被 sys / cmp 引用；组件和宿主都不要直接使用 |
| `sys` | 语义角色：表面（surface）、操作（action）、编辑提示色（cue）、状态（status）、媒体之上（media）、字体、形状、尺寸、层级 | 组件使用；**宿主定制主题时覆盖这一层** |
| `cmp` | 时间线、预览画布、控件部件（滑块、滚动条） | 组件使用；通过 `var()` 别名到 sys |

共 13 个分组，[Token 表](theme-tokens.md) 与主题验收页都按「层 → 分组」展示。

### 关键语义

- **表面分层**：`canvas`（编辑器画布，面板之间的底色）→ `panel`（面板、卡片）→ `background`（面板内的控件底，如 outline 按钮、复选框）→ `input`（输入框）→ `popover`（浮层）。默认浅色是纯白页面和纯白面板，面板靠细边框加 `shadow-panel` 阴影从页面浮起，不用灰色填充，也不用彩色；深色是页面最深（`#09090b`）、面板稍亮（`#141416`）、控件再亮一档。想要灰白分层，把浅色 `panel` 设成浅灰即可（主题验收页的「同色面板」「旧版」预设可对比）。
- **品牌色 `primary`**：全站唯一的品牌/操作色，`primary-foreground` 与其配对。Button 的 `default` 与 `primary` 变体相同，用的是 `solid` 系列 token（见下），`neutral` 是强对比的黑/白按钮，`outline` 为次操作，`ghost` 为工具操作，`destructive` 为危险操作。`accent` 表示中性的悬停底色，不是品牌色。`secondary`、选中背景、焦点环由 `primary` 派生，也可独立覆盖。
- **实心按钮 `solid`**（`solid-foreground`、`solid-hover`、`solid-pressed`）：只给大块实心按钮用。浅色下跟随 `primary`（近黑）；深色下默认是稳定的深灰（`#3f3f46`），而不是刺眼的白色块。复选框、开关、滑块、选中文字等小控件仍用对比度高的 `primary`（深色下近白）。宿主要给深色按钮换品牌色时，需要在 `dark` 里单独覆盖 `solid`，只覆盖 `primary` 不会改变深色下的实心按钮。
- **编辑提示色 `cue`** 独立于品牌色：播放头、吸附线、插入线、片段选中框、选框填充（`cue-fill`）、预览辅助线/选框/手柄、关键帧选中都读取它。宿主只换 `primary` 不会改变这些线；需要时单独覆盖 `cue`。测试会阻止这些 token 再引用 `primary`。
- **默认配色**：黑白灰，`primary` 浅色为近黑、深色为近白（深色下主按钮是白底黑字）；轨道保持彩色（紫 = 音频、青绿 = 文字）；只有 `cue` 是蓝色（浅色 `#0d99ff`，深色 `#4db3ff`）。主按钮、音频/文字轨标签等文字与背景的对比度由测试保证不低于 4.5:1；宿主自定义配色需要自己提供合适的前景色，不代表任意覆盖都自动满足对比度。

### Tailwind 映射

Tailwind 默认的颜色、圆角、阴影刻度被重置（`--color-*: initial` 等），只有 token 会生成工具类。映射由生成器产出 `src/theme/tailwind.generated.css`：

| 类别 | 工具类 |
| --- | --- |
| 颜色 | `bg-` / `text-` / `border-<token>`，如 `bg-panel`、`text-muted-foreground`、`bg-scrim`、`text-on-media`、`bg-track-label-background` |
| 圆角 | `rounded-sm` `rounded-control` `rounded-panel` `rounded-overlay` |
| 阴影 | `shadow-raised` `shadow-overlay` `shadow-dialog` `shadow-drag` |
| 字号 | `text-2xs`(11px) `text-xs`(12px) `text-sm`(13px) `text-base`(14px) `text-lg`(16px) `text-xl`（带统一行高） |
| 层级 | `z-raised` `z-sticky` `z-overlay` `z-toast` `z-drag` |
| 字体 | `font-sans`（= `font-ui`）、`font-mono` |

### 约束（theme-guard 测试）

`src/theme/__tests__/theme-guard.test.ts` 扫描源码，出现以下情况就失败：Tailwind 调色板类（`bg-black`、`text-slate-500`…）、任意颜色类（`bg-[#fff]`）、默认的圆角/阴影/字号/z-index 刻度（`rounded-md`、`shadow-lg`、`text-[10px]`、`z-50`）、在 theme 目录之外引用 `--bve-ref-*`、CSS 或内联样式里出现原始色值。工程内容颜色（时间线默认文字色、颜色选择器）在白名单中。

### 新增或调整样式

1. 先判断是否已有语义 token；有就直接用对应工具类。
2. 没有则在 `tokens.ts` 合适的分组里新增（sys 引用 ref，cmp 引用 sys），不要在组件里写原始值。
3. 运行 `node scripts/generate-theme.mjs` 生成 CSS、Tailwind 映射和文档，再 `pnpm test` 通过 guard。`--check` 验证生成物与清单一致，`pnpm build` 会自动生成。

## 视觉规范

- 普通控件没有立体高光和重阴影；浮层和对话框单独用轻阴影表达层级。
- Button、Input、Select、NumberField 共享尺寸档位：默认高度 compact 36px、comfortable 40px；小型 28→32px，中型 32→36px，大型 40→44px。菜单行高 28→32px。留白随密度变化；专业控件明确的固定几何和宿主显式设置的尺寸不会被一律放大。
- 表单控件为白底（`input`）加明显的边框（`input-border`），hover 加深为 `border-strong`；不要用 `bg-accent` 做输入框底色。
- 菜单与下拉选项：悬停 `popover-hover`，选中 `selected-background`（淡主色），选中且悬停 `selected-hover-background`。全部由 `.bve-menu-item` 的 data 属性驱动，不要在选项上写 `data-[highlighted]:bg-*` 工具类，它会盖掉选中态。
- 焦点：输入框、数字框、下拉触发器、文本域（`.bve-field`）聚焦时只把边框色变成 `ring`，没有外圈 outline 或 ring；复选框、开关、滑块、按钮等的键盘 `focus-visible` 是 2px、22% 透明度、无偏移的极淡描边（`.bve-control:focus-visible`）；弹层、菜单、对话框等会被程序聚焦的容器（`.bve-overlay`、`[role="dialog"]`、`[tabindex="-1"]`）不画浏览器默认聚焦环。规则只在 `theme/components.css` 里，组件里不要再写 `focus-visible:ring-*` / `outline-*`。
- hover、pressed、selected、disabled、invalid 各有明确的状态；常规文本、辅助文本与危险/警告反馈保持区分。
- 基础 UI 实现在 `components/ui`；专用输入保留原来的拖数值、表达式提交、取消和撤销分组逻辑。

## 字体与样式隔离

- `font-ui` / `font-mono` 控制界面字体，`text-2xs` … `text-xl` 控制字号；它们不修改工程里的文字字体。非系统 UI 字体需要宿主先通过本地 `@font-face` 等方式提供，设置一个字体名称本身不会下载字体。
- 生成的 CSS 全部限定在 `.bve-scope`：公开变量是 `--bve-*`，Tailwind 内部变量是 `--bve-tw-*` / `--bve-internal-*`，keyframes 带 `bve-` 前缀；`@layer` 在构建时展开为普通规则（按 `theme, base, components, utilities` 的顺序合并，保证同等优先级下工具类仍然压过组件规则；由 `tests/css-namespace.test.ts` 保护），宿主没放进任何层的全局 CSS（如 `button { … }`）因此不会压过编辑器的样式。不修改宿主的 `:root`、`body`、全局元素或全局 Tailwind 变量。
- 防不住：宿主的 `!important`，以及直接针对 `.bve-scope` 内部类名的覆盖。
- 容器需要明确高度；目前只支持桌面布局。

## 浮层与 Canvas

- 默认浮层在编辑器内部；`portalContainer` 允许放到宿主容器。主题边界会解析根元素最终的颜色、长度、字体和阴影并同步到浮层根，所以引用编辑器祖先上局部定义的变量（如 `var(--host-brand)`）也能用于外部浮层。外部容器自身的定位和层叠上下文由宿主负责，`z-overlay` / `z-toast` 控制编辑器浮层内部的层级。
- 放进宿主原生 `<dialog>` 时，把 `portalContainer` 指向 dialog 内部的元素，菜单才不会落到原生 top layer 后面。主题验收页有这个验证入口。
- 波形从同一份主题快照取得实际颜色，变化时重绘并复用采样缓存，不会重新读取或解码媒体。数值输入会在字体或尺寸变化后重新测量后缀位置。

## 时间线与内容边界

- 轨道、波形、超幅提示、播放头、吸附线、插入线、片段选中框、预览变换手柄和辅助线都有独立的 token。时间线缩略图继续按素材比例显示，不对素材像素应用主题色。
- 时间线几何以 `src/timeline/components/layout.ts` 为唯一基础定义：视频轨 65px、文字轨 25px、音频轨 50px，间距 6px，标签列 112px，标尺 22px。控件密度不改变这些数值，也不改变时间轴缩放、吸附阈值、拖放命中或时间计算。不要用 CSS 强改轨道高度；以后若开放高度配置，需要同时接入控制器的数值。
- 工程内的文字/字幕字体与颜色、背景颜色、蒙版、用户书签颜色不属于主题，换肤不会修改这些工程数据。颜色选择器色谱、透明棋盘、参考平台的布局图标、自定义光标、媒体占位等内容或几何常量允许保留固定值，不能机械地把所有白色、黑色或数字都替换成 token。

## 主题验收页

启动示例后访问 `http://127.0.0.1:5202/theme`（`pnpm dev`）：

- 「Token 清单」按 ref/sys/cmp 分层列出全部 token 及当前解析值；「组件样例」展示按钮、表单、浮层和时间线颜色；「真实编辑器」打开一个演示工程的完整编辑器。
- 可切换预设（极简 / 同色面板（上一版）/ 旧版，定义在 `examples/shared/theme-presets.ts`）、明暗、density、外部 portal 容器和宿主 dialog。想试新风格时先在这里写成 `appearance` 预设对比，满意后再把值写回 `tokens.ts` 的默认值。
- 展示组件位于独立的可选入口 `@basic-video-editor/editor/theme-preview`，不创建编辑器实例、不读写工程；普通编辑器入口不会加载它。

变更与迁移记录见 [opencut-changes/theme-system.md](opencut-changes/theme-system.md)。
