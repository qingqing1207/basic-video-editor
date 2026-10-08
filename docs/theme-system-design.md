# 剪辑台统一主题与样式规范设计

状态：设计历史；统一主题已进入实施与验收。实际接口、变量命名及边界以 [theme.md](./theme.md) 和 [Token 清单](./theme-tokens.md) 为准。本文保留最初的设计推导，拟定名字不作为额外 API。

## 1. 本次范围

按用户指定的五项统一：明暗主题；主色、背景、文字、边框与交互状态；按钮、菜单、输入框、弹窗；字体、圆角、间距与密度；轨道、波形与拖动提示。

默认外观延续现有桌面剪辑台：中性分层底色、平面控件、克制的边框、主色表达操作与选中。导出按钮沿用刚完成的扁平样式。保持现有面板组织和剪辑交互，不增加新组件库。

这是 UI 主题，不是视频模板。工程内的文字字体/颜色、画布背景、字幕样式、素材像素、用户设置的书签颜色不随主题改变；导出结果不受 UI 换肤影响。

## 2. 源码审计结论

| 位置 | 现状 | 设计要求 |
| --- | --- | --- |
| `src/react/style.css` | 已有 --bve-* 明暗配色，但 .panel 再次覆盖通用变量，字体、字号、圆角分散于 root 与 Tailwind theme | 按语义定义表面和控件变量，面板不再隐式改写一批根变量 |
| `src/components/ui` | Base UI 已统一；Button/Input/NumberField/Menu 等各自定义尺寸、圆角、阴影和焦点效果 | 共用视觉规范和尺寸档位，保持回调与焦点语义 |
| `src/react/video-editor.tsx` | 内容根和浮层根各自有 .bve-scope，外部 portal 不自动继承宿主覆盖；嵌套 .bve-scope 可能重置变量 | 统一主题边界，显式同步两个根的最终 token，不仅复制 light/dark 类 |
| `src/project/browser/project-browser.tsx` | 可选项目管理页有自己的界面与浮层 | 与 VideoEditor 消费同一份主题定义，不复制配色实现 |
| `src/timeline/components/theme.ts` | 文字轨、音频轨与波形有固定颜色 | 使用剪辑专用语义 token |
| `src/timeline/components/audio-waveform.tsx` | Canvas fillStyle 使用颜色字符串，峰值提示色固定；颜色属于绘制缓存签名 | 解析实际颜色并在主题变化时重绘；不重新解码音频 |
| `src/timeline/components/layout.ts` 与 track-layout/drop-target/selection-hit-testing | 轨道高度、间距、标签列等参与坐标计算 | 几何数值共用一份定义，不能只以 CSS 覆盖修改 |
| `src/timeline/bookmarks/components/bookmarks.tsx` | 存在 hsl(var(--bve-background))，但变量已是完整颜色值 | 统一颜色值契约，避免重复包裹导致无效颜色 |
| `css-build.config.mjs` | 已隔离选择器、layer、keyframes 和 --tw-*；仍需核查 Tailwind 生成的其它通用变量 | 最终产物审计所有变量和全局规则，公开 --bve-*，生成内部变量使用私有命名空间 |

## 3. Token 分层

单一 token 清单描述类型、默认值、用途、可覆盖性及是否影响几何。由清单生成类型和变量清单，避免 TypeScript 与 CSS 两份人工维护的默认值漂移。

### 基础尺度：内部复用

颜色基础值、字号档位、间距尺度、圆角尺度、线宽、阴影与短时过渡。间距使用 2/4/6/8/12/16/24px 的有限档位；不把每个历史随意数值变成独立公开变量。

### 语义 token：宿主主要覆盖入口

| 类别 | 代表变量（拟定） | 约定 |
| --- | --- | --- |
| 表面 | --bve-surface-editor / panel / control / overlay | 编辑器、面板、控件、浮层分层；无需宿主针对 .panel 重复覆盖 |
| 文本 | --bve-text-primary / secondary / disabled / on-accent | 正文、辅助、禁用、强调色上的文本 |
| 强调色 | --bve-accent / accent-hover / accent-pressed | 普通状态主色；与背景和前景组成可用颜色对 |
| 状态 | --bve-hover-background / selected-background / selected-border | 悬停、选中明确区分，焦点另行表达 |
| 边框与焦点 | --bve-border-default / border-strong / focus-ring / focus-width | 普通分隔、重要边界、键盘焦点 |
| 反馈 | --bve-danger / warning / success 及各自前景、背景 | 错误与警告不会因品牌色更换而消失 |
| 字体 | --bve-font-ui / font-mono / text-xs / text-sm / text-md / line-height-* | UI 与时间码使用不同字体角色；字体来源仍遵守本地/宿主注入边界 |
| 形状与层次 | --bve-radius-control / panel / overlay；--bve-shadow-overlay / dialog | 普通控件无立体高光；浮层允许轻阴影表达层级 |
| 密度 | --bve-control-height-* / control-padding-x / menu-item-height / panel-padding / field-gap / icon-size-* | 按控件角色选择档位，不靠根 font-size 或 transform 缩放整个编辑器 |

现有 --bve-primary 等变量先作为兼容入口或内部别名处理，旧名字与新名字的优先级要明确，避免同名不同义（尤其现有 accent 表示浅背景）。迁移完成后组件统一消费新语义，不形成永久双套规范。

### 剪辑专用与必要的组件 token

- 轨道：--bve-track-video-background、track-audio-background、track-text-background、track-label-color。
- 波形：--bve-waveform-color、waveform-overload-color。超幅判断阈值属于音频逻辑，不是主题。
- 时间线反馈：--bve-playhead-color、snap-line-color、drop-indicator-color、drop-indicator-width、clip-selected-border、drag-preview-opacity。
- 预览编辑辅助：变换手柄、辅助线、选择框；它们是界面覆盖层，不能进入成品视频。
- 特定控件仅在确有独立需求时增加 token，例如菜单圆角、滑块轨道粗细；普通按钮不再各自拥有完整独立调色盘。

## 4. 统一视觉规则

按钮分主操作、次操作、工具按钮与危险操作，颜色/边框/焦点由角色决定。Export 使用主操作，工具栏图标使用工具按钮，禁止业务页面临时拼渐变和重阴影。

Button、Input、Select、NumberField 同档位的高度、圆角、图标尺寸一致；保留小型属性输入与常规输入的区别。初始尺寸档位覆盖现有 28/32/36/40px 用途，迁移先对照现有布局，不粗暴把所有控件统一放大。

DropdownMenu、ContextMenu、Select 的选项共用行高、图标槽、选中与悬停规则。Popover、Dialog、Tooltip、Toast 共用浮层底色、边框与层次规范，但保留各自的信息密度。

每类交互控件至少定义 default、hover、pressed、focus-visible、disabled；可选控件额外定义 selected/checked/open，表单额外定义 invalid。视觉统一不改 Esc、外部点击、输入提交、撤销分组和焦点恢复规则。

颜色值接受完整 CSS 颜色表达式。透明度用明确的状态 token 或 color-mix 派生；不再要求使用方猜测变量存储的是 HSL 通道还是完整颜色。

## 5. 对外入口（拟定）

继续保留 theme="light" | "dark"，只负责明暗模式；新增 appearance 定义视觉方案，density 定义控件密度。主题定义与编辑器实例、工程存储分离。

```tsx
// 拟新增 API，当前尚不可使用
<VideoEditor
  editor={editor}
  theme={mode}
  appearance={adGenieAppearance}
  density="compact"
/>

<ProjectBrowser
  editor={editor}
  theme={mode}
  appearance={adGenieAppearance}
  density="compact"
  onOpenProject={openProject}
/>
```

主题对象用带类型的 base/light/dark 覆盖组织：base 放共享字体/形状；light/dark 放模式配色。默认定义内置，允许宿主部分覆盖。优先级明确为：默认定义 → 密度预设 → appearance.base → appearance 当前模式。高级 CSS 覆盖保持可用，但动态整套换肤以 React 主题入口为受支持路径。

默认 compact 保持现有专业编辑器密度；comfortable 调整控件、菜单与属性区留白。轨道高度与时间轴缩放不随密度变化。不要把“字号更大”自动解释为“轨道更高、每秒像素更多”。

宿主可把自己的设计变量映射到主题对象。引用宿主 CSS 变量时，在编辑器根解析后同步最终值到外部浮层；不能把依赖局部祖先的 var(--host-*) 原封不动搬到 body 下。

无需额外必填 ThemeProvider：VideoEditor 与 ProjectBrowser 内部复用同一主题边界实现，使用者只传同一个 appearance 对象即可。

## 6. DOM、浮层、Canvas 的一致性

主题边界在 mode、appearance、density 更新时生成主题快照，同时服务内容根、浮层根和需要 JS 绘制的视图；销毁释放观察器与订阅。主题变化不重建 EditorCore，不重新导入工程，不影响撤销栈。

Canvas 不能直接依赖 fillStyle="var(--bve-waveform-color)"。通过真实 DOM 计算样式解析主题颜色，再给波形绘制代码传最终颜色。CSS 变量引用和 color-mix 需解析为实际可绘制值；变化后失效绘制缓存并重绘，复用音频采样缓存。

首版不承诺自动发现宿主任意 stylesheet 的运行时变动：动态换肤由受支持的 mode/appearance 更新触发；文档明确高级 CSS 静态覆盖与动态主题 API 的区别，避免 DOM 已变色而 Canvas 停留旧色。

外部 portal、宿主 dialog 内 portal 与默认内部 portal 都使用相同最终主题；浮层层级统一管理并允许宿主设置基准。所有样式仍限制在编辑器范围，不改宿主 :root、body、通用标签或全局字体。

## 7. 几何尺寸的边界

当前默认轨道高度 video=65、text=25、audio=50px，轨道间距=6px，标签列=112px，标尺=22px。第一阶段保持这些数值和交互阈值，集中记录为内部 geometry 定义。

视觉线宽、圆角、颜色允许主题化；轨道高度、片段命中范围等不能成为仅靠 CSS 自由覆盖的公开 token。若以后开放轨道尺寸配置，应从类型化几何配置同时派生 CSS 与控制器所需的数值，并覆盖滚动、关键帧展开、框选、拖放和指示线验收。

不将自动滚动速度、吸附阈值、时间 tick、播放帧率、素材比例、拖动开始阈值混入主题体系。

## 8. 实施顺序与交付

1. 建立 token 清单、状态矩阵、当前视觉基线，标记代码里的 UI 固定值与工程内容值。
2. 实现主题边界、类型、明暗默认方案、外部浮层同步；先保持默认外观。
3. 普通控件统一尺寸与状态，再迁移数值输入、颜色选择与浮层；保留现有交互接口。
4. 轨道、波形、拖动提示及预览辅助线接入；UI 密度与时间线几何分别验证。
5. 提供独立样式展示页：按钮、表单、菜单、弹窗、Toast、轨道、波形与各状态。展示明暗、两档密度和一份宿主自定义主题。
6. 更新 theme.md、token 对照表、宿主映射示例、变更记录与验收结果。统一设计交付后再登记为已实现功能。

建议新增 src/theme 下的定义、默认方案、解析与 React 边界；保留单个 editor 包，不拆出额外主题包。

## 9. 验收

- 替换一份 appearance，按钮、面板、菜单、Toast、时间线、波形同时变化；动态切换无需重开工程。
- 明暗 × 两档控件密度，覆盖普通/悬停/按下/焦点/禁用/选中/错误；文本与焦点保持足够对比度。
- 默认 portal、外部容器、宿主 dialog 内嵌入都不丢主题，宿主输入框和样式不受影响。
- Canvas 颜色实时变化，换肤不触发音频重新解码；素材画面与工程内容配色、导出结果不变。
- 不同密度下拖动、裁剪、吸附、框选、纵向滚动、关键帧展开、指示线和撤销保持正确；不要只检查截图。
- 消费构建产物的 Vite 和 Next 示例通过；最终 CSS 的选择器、变量、layers、keyframes 隔离通过审计。
- UI 固定颜色/尺寸扫描采用例外清单，区分内容渲染、算法常量和主题值，不机械替换全部数字与色值。
