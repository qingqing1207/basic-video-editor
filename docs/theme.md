# 主题、密度与统一样式

编辑器使用这一套主题（项目列表页是宿主自己的页面，不使用编辑器的主题 token）。导入 `@basic-video-editor/editor/style.css`，消费者无需安装 Tailwind。公开主题类型由 `src/theme/tokens.ts` 的单一清单推导；构建从该清单生成默认 CSS 和 [完整 Token 表](./theme-tokens.md)。

## Token 架构（ref → sys → cmp）

Token 分三层，只允许向下引用（cmp → sys → ref），由 `src/theme/tokens.ts` 单一维护：

| 层 | 内容 | 谁使用 |
| --- | --- | --- |
| `ref` | 原始色板（`--bve-ref-*`，如 `ref-neutral-800`、`ref-blue-600`），不随明暗模式变化，是唯一含原始色值的层 | 只被 sys/cmp 引用；组件和宿主不要直接使用 |
| `sys` | 语义角色：surface、action、status、media、typography、shape、metrics、elevation | 组件使用；**宿主定制主题时覆盖这一层** |
| `cmp` | 时间线、预览画布、控件部件（滑块、滚动条） | 组件使用；通过 `var()` 别名到 sys |

共 12 个分组，Token 页（Theme Lab）和 [完整 Token 表](./theme-tokens.md) 均按「层 → 分组」展示。

### Tailwind 映射

Tailwind 默认的颜色、圆角、阴影刻度被重置（`--color-*: initial` 等），只有 token 会生成工具类。映射由生成器产出 `src/theme/tailwind.generated.css`：

- 颜色：`bg-/text-/border-<token>`，如 `bg-panel`、`text-muted-foreground`、`bg-scrim`、`text-on-media`、`bg-track-label-background`。
- 圆角：`rounded-sm | control | panel | overlay`。
- 阴影：`shadow-raised | overlay | dialog | drag`。
- 字号：`text-2xs | xs | sm | base | lg | xl`（带统一行高）。
- 层级：`z-raised | sticky | overlay | toast | drag`。
- 字体：`font-sans`（= font-ui）、`font-mono`。

### 约束（theme-guard 测试）

`src/theme/__tests__/theme-guard.test.ts` 会扫描源码并在以下情况失败：使用 Tailwind 调色板类（`bg-black`、`text-slate-500`…）、任意颜色类（`bg-[#fff]`）、默认圆角/阴影/字号/z-index 刻度（`rounded-md`、`shadow-lg`、`text-[10px]`、`z-50`）、在 theme 目录外引用 `--bve-ref-*`、CSS 或内联样式里出现原始色值。工程内容颜色（时间线默认文字色、颜色选择器）在白名单中。

### 迁移对照

| 旧写法 | 新写法 |
| --- | --- |
| `rounded-md` / `rounded-lg` / `rounded-2xl` / `rounded-xs` / `rounded` | `rounded-control` / `rounded-overlay` / `rounded-panel` / `rounded-sm` / `rounded-sm` |
| `shadow-xs/sm/md/lg` / `shadow-2xl` | `shadow-raised` / `shadow-drag` |
| `bg-black/50..70` | `bg-scrim`（或 `bg-scrim-subtle`） |
| `text-white`、`border-white/N` | `text-on-media`、`border-on-media/N` |
| `text-[10px]` / `text-[11px]` / `text-[0.9rem]` | `text-2xs` / `text-xs` / `text-base` |
| `z-10/20/50/100/250/9999` | `z-raised/sticky/overlay/overlay/toast/drag` |
| token `text-md` | `text-base` |
| token `overlay-z-index` | `z-overlay` |
| token `icon-size-sm` | 已移除，直接用 `icon-size` |

样式改版（2026-10-08）带来的行为变化：

- 编辑器/项目页根背景由 `background` 改为 `canvas`；面板由浅灰改为白色。宿主若覆盖过 `background`/`panel` 来给页面着色，请同时设置 `canvas`。
- Button `default` 变体由黑色改为品牌色；要旧的黑色按钮用 `variant="neutral"`。
- 播放头等提示线由 `primary` 改为 `cue`；主色不再影响它们。
- 圆角阶梯 4 / 6 / 10 / 10px（sm / control / panel / overlay）；字号 xs 11、sm 13、base 14、lg 16px；面板间距与外边距改为 `layout-gap` / `layout-inset`（各 6px）。
- 默认主题为「极简」：黑白灰调色板，`primary` 浅色为近黑、深色为近白（主按钮在深色下是白底黑字）；轨道色保持彩色（紫=音频、青绿=文字），只有 `cue` 提示线是蓝色。
- Theme Lab 的「宿主外观」只保留 极简（当前默认）/ 旧版（改版前样式，仅用于对比）两套（`examples/shared/theme-presets.ts`）。想尝试新风格时，先在这里写成 `appearance` 预设对比，满意后再把值写回 `tokens.ts` 的默认值。

新增 token：`canvas`、`input-border`、`selected-hover-background`、`cue`、`cue-fill`、`layout-gap`、`layout-inset`、`ref-*` 色板、`on-media`、`scrim`、`scrim-subtle`、`text-2xs`、`menu-item-padding-y`、`shadow-raised`、`shadow-drag`、`z-raised/sticky/overlay/toast/drag`。

### 新增或调整样式的流程

1. 先判断是否已有语义 token；有则直接用对应工具类。
2. 没有则在 `tokens.ts` 的合适分组里新增（sys 引用 ref；cmp 引用 sys），不要在组件里写原始值。
3. 运行 `node scripts/generate-theme.mjs` 生成 CSS/Tailwind 映射/文档，再 `pnpm test` 通过 guard。

## 接入

```tsx
import { VideoEditor, type EditorAppearance } from '@basic-video-editor/editor';
import '@basic-video-editor/editor/style.css';

const appearance: EditorAppearance = {
  base: {
    'font-ui': 'system-ui, sans-serif',
    'radius-control': '6px',
    'radius-panel': '8px',
    'radius-overlay': '10px',
  },
  light: {
    primary: '#7045bc',
    'primary-foreground': '#fff',
    background: '#f7f6fa',
    panel: '#fff',
    input: '#f0edf5',
    popover: '#fff',
  },
  dark: {
    primary: '#8d64d2',
    'primary-foreground': '#fff',
    background: '#17151e',
    panel: '#211e2b',
    input: '#2c2839',
    popover: '#302b3c',
    foreground: '#eeeaf7',
    border: '#484053',
  },
};

<VideoEditor editor={editor} theme={mode} appearance={appearance} density="compact" />
```

`theme` 仍是 light/dark。VideoEditor 保留 defaultTheme/onThemeChange，也可以完全由宿主通过 theme 控制。`appearance` 可只提供少量覆盖；`density` 默认 compact，可选 comfortable。无需额外 Provider，不用重建 createEditor，也不把主题写入工程 JSON。

覆盖优先级：CSS 默认模式 → density 预设 → appearance.base → appearance 当前模式 → 根 style 的显式覆盖。外部静态 CSS 受正常 CSS 层叠规则约束；推荐 appearance 作为运行时统一入口。

## 视觉规范

- 表面分层：`canvas`（编辑器画布，面板之间的底色）→ `panel`（面板、卡片，白色）→ `background`（面板内的控件底，如 outline 按钮、复选框）→ `input`（输入框）→ `popover`（浮层）。默认 `canvas` 与 `panel` 同色（页面和面板连成一体，只靠 1px 细线分区）；宿主想要“卡片浮在灰底上”的效果，只需把 `canvas` 单独设成比 `panel` 更灰/更深的颜色。
- `primary` 是全站唯一的品牌/操作色，全站统一；`primary-foreground` 与其配对。Button 的 `default` 与 `primary` 变体相同（品牌色），`neutral` 是强对比的黑/白按钮，`outline` 为次操作，`ghost` 为工具操作，`destructive` 为危险操作。
- **编辑提示色 `cue` 独立于品牌色**（默认 #0d99ff 的明亮天蓝，深色 #4db3ff）：播放头、吸附线、插入线、片段选中框、选框填充（`cue-fill`）、预览辅助线/选框/手柄、关键帧选中都读取 `cue`（默认蓝）。宿主只换 `primary` 不会改变这些线；需要时单独覆盖 `cue`。测试会阻止这些 token 再引用 primary。
- accent 沿用原有命名，表示中性悬停底色，不是品牌色。secondary、选中背景、焦点环由 primary 派生（secondary 无边框，选中态为淡色块），也可以独立覆盖。
- 普通控件无立体高光和重阴影；overlay/dialog 单独用轻阴影表达层级。
- Button、Input、Select、NumberField 共享尺寸档位。普通高度 compact 为 36px，comfortable 为 40px；小型属性控件 28→32px，中型控件 32→36px，大型控件 40→44px。
- 表单控件为白底（`input`）+ 明显的边框（`input-border`），hover 加深为 `border-strong`；不要再用 `bg-accent` 做输入框底色。
- 菜单/下拉选项状态：悬停 `popover-hover`（灰）、选中 `selected-background`（淡主色）、选中且悬停 `selected-hover-background`（更深一档），全部由 `.bve-menu-item` 的 data 属性驱动；不要在选项上写 `data-[highlighted]:bg-*` 工具类，它会盖掉选中态。
- 菜单行高 28→32px；面板和表单留白随密度变化。专业控件明确的固定几何、宿主显式尺寸覆盖不会被一律放大。
- 焦点：输入框、数字框、下拉触发器、文本域（`.bve-field`）聚焦时只变边框色为 `ring`，没有外圈 outline/ring；复选框、开关、滑块、按钮等的键盘 focus-visible 为 2px、22% 透明度、无偏移的极淡描边（`.bve-control:focus-visible`）。弹层、菜单、对话框等会被程序聚焦的容器（`.bve-overlay`、`[role="dialog"]`、`[tabindex="-1"]`）不画浏览器默认聚焦环。这些规则都只在 `theme/components.css`，组件里不要再写 `focus-visible:ring-*`/`outline-*`。hover、pressed、selected、disabled、invalid 分别有明确状态。常规文本、辅助文本与危险/警告反馈保持区分。
- 基础 UI 实现在 components/ui；专用输入仍保留原拖数值、表达式提交、取消和撤销分组逻辑。

默认主色为近黑/近白（浅色 #18181b/白字，深色 #f4f4f5/#18181b 字），对比度远高于 4.5:1；音频（紫）/文字（青绿）轨标签与背景也通过 4.5:1 对比度测试。宿主自定义配色需同时提供合适的前景色，这不代表任意覆盖都自动满足对比度。

## 字体与样式隔离

font-ui/font-mono 控制界面字体，text-2xs … text-xl 控制字号。它们不修改工程文字字体。非系统 UI 字体由宿主先通过本地 @font-face 等方式提供；设置一个字体名称本身不会下载字体。

生成 CSS 限制在 .bve-scope，公开变量是 --bve-*，Tailwind 内部变量是 --bve-tw-* / --bve-internal-*，layer/keyframes 也有 bve- 前缀。不改宿主 :root、body、全局元素或全局 Tailwind 变量。容器需明确高度，仍为桌面布局。

静态 CSS 覆盖仍可使用：

```css
/* 放在包 CSS 之后；直接命中根，不再针对 .panel 重复覆盖。 */
.editor-host .bve-scope {
  --bve-primary: #7045bc;
  --bve-panel: #faf9fc;
}
```

动态主题切换请更新 theme/appearance/density。系统不会轮询宿主任意 stylesheet 变化；仅修改一个无关祖先 class 而没有主题入口更新，不保证 Canvas 立即重绘。

## 浮层与 Canvas

默认浮层在编辑器内部；VideoEditor 的 portalContainer 允许放到宿主容器。主题边界解析根的最终颜色、长度、字体和阴影，并同步到浮层根，因此引用编辑器祖先局部定义的 宿主自己的 CSS 变量（如 `var(--host-brand)`） 也可用于外部浮层。外部容器本身的定位与层叠上下文由宿主负责，z-overlay / z-toast 控制编辑器浮层内部层级。

宿主原生 dialog 中嵌入时，把 portalContainer 指向 dialog 内部元素。这样菜单不会落到原生 top layer 后面。主题展示页包含这一验证入口。

波形从同一主题快照取得实际颜色，变化时重绘并复用采样缓存，不重新读取/解码媒体。数值输入会在字体/尺寸变化后重新测量后缀位置。

## 时间线与内容边界

轨道、波形、超幅提示、播放头、吸附线、插入线、片段选中框、预览变换手柄和辅助线有独立 token。时间线缩略图继续按素材比例展示，不对素材像素应用主题色。

时间线几何仍以 `src/timeline/components/layout.ts` 为唯一基础定义：视频 65px、文字 25px、音频 50px，间距 6px，标签列 112px，标尺 22px。控件密度不改变这些数值，不改变时间轴缩放、吸附阈值、拖放命中或时间计算。不要用 CSS 强改轨道高度；以后若开放高度配置，需要同时接入控制器数值。

工程内文字/字幕字体与颜色、背景颜色、蒙版、用户书签色不属于主题，换肤不会修改这些工程数据。颜色选择器色谱、透明棋盘、参考平台布局图标、自定义游标、媒体占位等内容/几何常量允许保留固定值；不能机械替换所有白色、黑色或数字。

## 展示与验证入口

- Next：`http://127.0.0.1:5202/theme`
- Token 页按 ref/sys/cmp 分层展示全部 token 及当前解析值；可切换预设（极简 / 旧版）、明暗、compact/comfortable、外部 portal、宿主 dialog；「真实编辑器」标签打开一个演示工程的完整编辑器（项目列表属于宿主页面，不在这里）。
- 展示组件位于独立可选入口 `@basic-video-editor/editor/theme-preview`，不创建 EditorCore、不读写工程；普通编辑器入口不会加载展示页代码。
- [实施与验收记录](./opencut-changes/theme-system.md)；最初设计讨论保存在 [设计方案](./theme-system-design.md)。

修改 token 清单后运行 `node scripts/generate-theme.mjs`；`--check` 验证生成物与清单一致。正常 `pnpm build` 会自动生成。最终运行 `pnpm build:examples`、`pnpm test`、`pnpm audit:package`，再进行浏览器交互验证。
