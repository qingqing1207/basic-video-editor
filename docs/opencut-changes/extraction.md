# 本地化、封装与明确删除的功能

来源是用户明确给出的抽离计划及后续删减要求。下列属于我们选择的产品边界，不表示 OpenCut 原功能有缺陷。

## 独立组件与宿主适配

| 原版形态 | 当前项目 |
| --- | --- |
| OpenCut 网站应用内的剪辑台 | pnpm workspace 内独立 React 19 ESM 包，类型声明、预编译 CSS、WASM；opencut/ 只用于对照，不参与构建 |
| 编辑器与网站／路由／存储关联 | createEditor 创建运行实例，VideoEditor 显示剪辑界面，ProjectBrowser 可选；库不绑定 Next 路由 |
| 原基础 UI 依赖 | Base UI 控件替换，移除 Radix/Sonner；专用媒体拖动、数值输入算法保留 |
| 网站全局样式、body 浮层 | 编辑器 CSS/变量命名空间和受控浮层容器；宿主无需安装 Tailwind，支持明暗主题 |
| 固定服务与全局通知入口 | ProjectRepository、AssetRepository、FontProvider、TranscriptionProvider 及实例通知；默认本地，宿主可替换 |
| 隐式单例和页面级输入 | 明确限制一个活动实例和一个挂载视图；快捷键／粘贴限定编辑器作用域，统一关闭、保存、取消与资源释放 |
| 网站工程格式／历史迁移 | 自有存储命名空间；当前 version 2 单时间线，工程按 ID 隔离，JSON/元数据在 IndexedDB、媒体在 OPFS；不读取原版浏览器数据 |
| 应用下载流程 | 导出返回 Blob，由宿主下载或接上传；提供 Vite/Next 示例消费实际构建产物 |

源码入口：`packages/editor/src/index.tsx`、`api/`、`react/`、`browser/`、`components/ui/`、`services/storage/`、`packages/render-wasm/`。精确接入见 [integration](../integration.md)、[adapters](../adapters.md)、[theme](../theme.md)、[wasm](../wasm.md)、[许可](../licenses.md)。

## 字幕、字体与渲染

- 保留 SRT/ASS 本地导入、警告、生成文字片段、编辑和渲染。删除 Transformers、Whisper Worker 和默认模型下载，自动转录改为宿主注入接口；未配置时不冒充可用。
- 字体选择器保留；默认系统字体及随包 Inter，移除 Google Fonts 在线目录和加载。宿主可提供字体，缺失时有提示及明确回退。
- 保留背景模糊和蒙版羽化所需内部 GPU 算法；删除公共特效注册机制并从精简 Rust 源重新构建 WASM。

## 明确删除清单

| 用户决策 | 删除范围 | 保留／注意 |
| --- | --- | --- |
| 去除外部服务 | 账号、服务端数据库/Redis、CMS、官网、反馈、统计、更新通知、在线音效与收藏、旧工程迁移及相关服务配置 | IndexedDB 本地工程存储仍在，不等于“删除所有数据库能力” |
| 删除 stickers/effects/transitions/adjustment | 入口、类型、命令、注册表、面板、渲染分支、静态资源及相关依赖；贴纸内本地图形也删除 | 保留背景模糊、蒙版内部绘制，不暴露为通用特效能力 |
| 删除 Replace media | 菜单、拖放目标类型、目标片段命中／高亮和空处理分支 | Reveal media 仍保留；占用位置走原插入规则，见 记录 |
| 删除多场景且不兼容 | Main scene 按钮、侧栏、场景增删改切换 API、命令、场景数组、旧格式兼容；改 timeline.tracks/bookmarks | 书签保留；渲染内部 buildScene 是合成树，不是多场景功能残留。旧数据当时经授权清理，本轮没有清理数据，见 记录 |
| 删除 Freeze frame | 禁用按钮、提示和空点击函数及专用引用 | 固定原版没有对应定格引擎、命令或快捷键，不能写成删除了完整已实现功能 |

## 未完成边界

组件化与本地服务删减已有实现和阶段性验收；完整抽离仍以 [实施状态](../status.md) 和 交互记录 为准。尚未完成 Ad Genie 实际集成，未实现远程文件后台、自己的自动转录服务、移动端布局或未经验证的全浏览器支持。
