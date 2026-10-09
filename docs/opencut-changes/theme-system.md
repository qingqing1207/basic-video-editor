# 统一主题与样式 Token

实施日期：2026-10-06。对照版本：OpenCut `cf5e79e9`。

> 2026-10-07 token 收敛：重构为 ref → sys → cmp 三层，Tailwind 默认调色板/圆角/阴影刻度重置并由生成器映射 token，新增 theme-guard 测试禁止硬编码样式值，源码 36 个文件已迁移。架构、映射与迁移对照见 [theme.md](../theme.md)。以下为首次实施记录，其中的 token 名以当时为准。

## 需求与范围

用户要求统一明暗主题、基础色、基础组件外观、字号/圆角/间距/密度、轨道与波形及拖动提示，方便宿主整体替换主题。沿用现有编辑器布局和扁平控件，不重新设计剪辑流程。

原抽离版已有 `theme` 和部分 `--bve-*` 颜色，但面板还会重设变量，尺寸分散在工具类中，轨道/波形/浮层仍有固定颜色，外置浮层不能可靠继承宿主局部变量。本轮把这些路径统一接入同一份主题定义。原版仓库未修改。

## 最终实现

| 层次 | 当前实现与入口 |
| --- | --- |
| 公开 API | `VideoEditor`、`ProjectBrowser` 接收 `theme`、`appearance`、`density`；原有主题参数兼容，不重建编辑器实例 |
| Token 来源 | `packages/editor/src/theme/tokens.ts` 同时提供默认值、类型和清单；构建生成 CSS 及文档，避免两份默认值漂移 |
| 基础控件 | `components/ui` 的按钮、输入、数值框、菜单、选择器、弹窗、提示等统一表面、尺寸、圆角、焦点、选中、禁用、错误状态 |
| 专用界面 | 轨道背景、波形及超幅色、播放头、吸附线、拖放线、选中框、预览变换手柄、辅助线使用语义 Token |
| 浮层 | `theme/use-editor-theme.tsx` 读取根节点最终样式，解析颜色/尺寸等，并同步到编辑器所属 portal；支持宿主局部 `var(--host-brand)` |
| Canvas | 波形从相同主题快照取色，颜色变化触发重绘；沿用音频采样缓存，不重新解码媒体 |
| 密度 | compact/comfortable 改变控件高度、菜单行高、面板与表单留白；字体变化后数值输入后缀重新测量 |
| 隔离 | CSS 选择器、变量声明、层与动画均带编辑器作用域/命名空间；新增构建产物变量声明审计 |
| 展示 | 独立可选 `@basic-video-editor/editor/theme-preview` 入口；Vite `/theme.html` 和 Next `/theme` 使用实际构建产物 |

`primary` 继续表示强调色；`accent` 保持原来中性悬停色的含义。默认浅色主按钮改为较深蓝色配白字以满足对比度，深色主按钮为浅蓝配深色字。新主题可只覆盖少量变量，派生状态会跟随。

另外修复了旧封装显式关闭焦点恢复的问题：菜单、Select、Dialog 关闭后恢复 Base UI 默认焦点返回，调用方已有主动取消行为仍被尊重。

## 验证结果

### 构建与自动检查

- 编辑器 ESM/CSS/类型构建成功。
- Vite 和 Next 生产构建成功；Next `/theme` 静态页面及客户端边界通过。
- 18 个测试文件、132 项测试通过，包含主题覆盖与复位、别名完整性、默认对比度、SSR 占位和几何配置边界。
- 包审计通过：作用域 CSS、变量/层/动画前缀、依赖及已删除功能检查通过。
- 生成器 `--check` 保证 Token CSS/文档与清单一致。
- 更新 `artifacts/basic-video-editor-editor-0.1.0.tgz`，独立 `.tools/package-smoke` 从 tarball 安装后通过 TypeScript 与 Vite 构建；新主题类型、VideoEditor/ProjectBrowser 参数及可选预览入口可解析。

### Chromium 实际交互

| 场景 | 观察结果 |
| --- | --- |
| 默认浅色切换自定义深色 | 按钮、输入、面板、菜单、选中项、波形统一换色；输入中的文本保留 |
| compact → comfortable | 普通按钮高度 36→40px；宿主输入仍为 21.5px |
| 外置 portal | 根祖先局部品牌变量在外部菜单解析为 `rgb(141, 100, 210)`，弹层背景为 `rgb(48, 43, 60)`；Vite 和 Next 均验证 |
| Canvas 波形 | 自定义颜色为 `#ffe3a1`；取消覆盖后恢复 `rgba(255, 255, 255, 0.8)` |
| 菜单/子菜单 | 鼠标打开、方向键打开子菜单、Esc 关闭；焦点回到 Menu 按钮 |
| Select / Dialog | Esc 关闭，分别回到 Preview zoom / Dialog 按钮 |
| 宿主原生 dialog | 菜单 portal 在 dialog 内，主题正确，浮层可操作 |
| 真编辑器换肤 | 使用已有 `Track management verification` 测试工程；预览 Canvas 同一帧的像素快照一致，视频片段宽度 2058px、高度 65px 在换肤前后不变 |
| 真编辑器拖放 | 向顶部插入时指示线与首行顶部同为约 439.664px，颜色为自定义橙色；放下后落点匹配，撤销恢复原行，总轨道数恢复为 6 |
| 时间线缩放 | Zoom in / Zoom out 可操作，滑块值更新，未受密度影响 |
| Next 控制台 | 主题页动态换肤、外部菜单交互后无捕获的 error 日志 |

截图：默认浅色、自定义深色、实际拖动指示线。

## 明确边界

- 轨道高度/间距/标签宽度/标尺高度仍由 `timeline/components/layout.ts` 管理，未开放仅改变 CSS 的几何 Token，避免画面与拖放命中分离。
- 工程内字幕和文字样式、画布背景、蒙版参数、书签自定义颜色及媒体像素不属于界面主题，不被换肤修改。
- 自定义字体资源由宿主提供；修改 UI 字体不会在线下载，也不修改工程字体。
- 动态换肤走 `theme/appearance/density`。静态 CSS 覆盖支持，任意外部 stylesheet/class 的独立变动没有轮询监听。
- 本轮没有重跑完整媒体导出、OS 输入法和 Safari/Firefox 全套交互，不把主题验收当成整体剪辑台验收。
- Vite 仍提示已有较大产物块；构建成功，该提示不代表已完成进一步拆包优化。

接入示例与覆盖优先级见 [主题使用说明](../theme.md)，全部公开变量见 [Token 表](../theme-tokens.md)。

## Token 收敛与样式改版（2026-10-07 至 2026-10-08）

用户的要求：梳理 token，按设计规范重新设计，把主题样式收敛起来，方便后面优化样式；随后因为整体观感老旧（大面积灰色加浅蓝），要求整体调整颜色、圆角和边距，把「系统主题色」和「剪辑台提示线」拆开，并最终采用极简的黑白灰风格。

### 结构

- 三层：`ref`（原始色板）→ `sys`（语义角色）→ `cmp`（时间线、预览、控件）。只允许向下引用；原始色值只存在于 `ref`。
- 13 个分组，由 `scripts/generate-theme.mjs` 生成默认 CSS、`tailwind.generated.css` 和 `docs/theme-tokens.md`。
- Tailwind 默认的颜色、圆角、阴影刻度被重置，只有 token 生成工具类；源码里 36 个文件的硬编码样式改成 token。
- `theme-guard.test.ts` 阻止硬编码样式回流；`theme-system.test.ts` 保证主按钮与轨道标签的对比度。

### 迁移对照

| 旧写法 | 新写法 |
| --- | --- |
| `rounded-md` / `rounded-lg` / `rounded-2xl` / `rounded-xs` / `rounded` | `rounded-control` / `rounded-overlay` / `rounded-panel` / `rounded-sm` / `rounded-sm` |
| `shadow-xs/sm/md/lg`、`shadow-2xl` | `shadow-raised`、`shadow-drag` |
| `bg-black/50..70` | `bg-scrim`（或 `bg-scrim-subtle`） |
| `text-white`、`border-white/N` | `text-on-media`、`border-on-media/N` |
| `text-[10px]` / `text-[11px]` / `text-[0.9rem]` | `text-2xs` / `text-xs` / `text-base` |
| `z-10/20/50/100/250/9999` | `z-raised` / `z-sticky` / `z-overlay` / `z-overlay` / `z-toast` / `z-drag` |
| token `text-md` | `text-base` |
| token `overlay-z-index` | `z-overlay` |
| token `icon-size-sm` | 已移除，直接用 `icon-size` |

### 行为变化

- 根背景由 `background` 改为新增的 `canvas`，默认与 `panel` 同色。宿主若覆盖过 `background` / `panel` 给页面着色，需要同时设置 `canvas`。
- 播放头、吸附线、插入线、片段选中框、预览手柄由 `primary` 改读新增的 `cue`；换品牌色不再改变它们。
- Button 的 `default` 变体由黑色改为品牌色；原来的黑色按钮对应新增的 `neutral` 变体。
- 表单控件改为白底加 `input-border`；菜单选项新增 `selected-hover-background`；聚焦样式统一（输入框只变边框色，其余是极淡描边，弹层不画浏览器默认聚焦环）；选项上的 `data-[highlighted]:bg-*` 工具类会盖掉选中态，已移除。
- 圆角 4 / 6 / 10 / 10px，字号 xs 11、sm 13、base 14、lg 16px，面板间距与外边距为 `layout-gap` / `layout-inset`（各 6px）。
- 默认调色板为黑白灰，轨道保持彩色，`cue` 为蓝色；新增 `ref-*`、`canvas`、`input-border`、`selected-hover-background`、`cue`、`cue-fill`、`layout-gap`、`layout-inset`、`on-media`、`scrim`、`scrim-subtle`、`text-2xs`、`menu-item-padding-y`、`shadow-raised`、`shadow-drag`、`z-*` 等 token。

### 层次与按钮调整（2026-10-09）

用户反馈：浅色下页面和面板同色（整块白）不好看，不如原版 OpenCut 的灰白区别；深色下主按钮从黑变白太突兀；整体需要再看一遍。

- 浅色层次不靠灰填充（试过浅灰面板，观感不佳）：页面和面板都是白色，面板靠细边框分区；新增 `shadow-panel` token（默认 `none`，试过阴影，在面板边缘被裁剪出残影，故不启用），面板间距保持 6px。深色：页面 `#09090b` 最深、面板 `#141416`、输入框和浮层 `#1f1f23`、悬停 `#27272a`。原来「同色面板」保留为主题验收页的预设，便于对比。
- 新增 `solid` 系列 token（`solid`、`solid-foreground`、`solid-hover`、`solid-pressed`），取代 `primary-hover` / `primary-pressed`，专给大块实心按钮：浅色跟随 `primary`，深色默认深灰。原因是 `primary` 在深色下同时被小控件当作高对比强调色，不能变灰；测试保证按钮四个状态文字对比度不低于 4.5:1。
- 面板标题栏、导出弹层、书签颜色选择器不再用 `bg-background`（深色下比面板更深，形成一条深带），改用面板或 `popover`。
- `text-2xs` 10→11px，`text-xs` 11→12px。
- 导出弹层的 Format / Quality / Audio 行右侧显示当前值。

### 方案对比

主题验收页保留「极简」（当前默认）和「旧版」（改版前样式，仅用于对比）。设计过程中还评估过暖色、紫色宿主品牌等方案，已按要求删除。

### 层次与提示色重做（2026-10-09）

- 页面 `canvas` 浅色 `#f4f4f5`、面板 `panel` 白色，面板不再画边框（`.panel` 边框透明），层次只靠一档明度差；深色保持页面最深、面板稍亮。
- 编辑提示色 `cue`（播放头、吸附线、拖放指示、选中片段、预览选框和参考线）保持蓝色：它是界面里唯一的彩色，专门用于操作线，在任意视频画面和轨道上都清晰。
- 面板和浮层圆角 10→8px，控件 6px、小元素 4px 不变。
