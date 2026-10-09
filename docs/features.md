# 功能边界与源码对应

原版路径以 `opencut/apps/web/src/` 为起点，抽离路径以 `packages/editor/src/` 为起点。以下同名目录保留原算法和组件结构；依赖入口、服务边界及 Base UI 适配发生变化。是否已实测通过见 [status.md](status.md)；源码存在不等于验收通过。

| 保留能力 | 原版 → 抽离位置 | 验收场景 |
| --- | --- | --- |
| 视频/图片/音频导入、列表、排序 | media/、components/editor/panels/assets/ → 同路径 | 三类文件、网格/列表、拖入/粘贴、失败反馈 |
| 时间线拖动、修饰键、多选、框选、裁剪、吸附、缩放、边缘滚动 | timeline/controllers/、timeline/hooks/、timeline/components/ → 同路径 | 不同缩放、跨轨、Esc、边缘、撤销恢复 |
| 分割、复制、联动编辑、撤销重做 | commands/、clipboard/、ripple/、core/managers/commands.ts → 同路径 | 整组命令前后片段/播放头/选择对照 |
| 画布变换、辅助线、文字编辑、缩放和平移 | preview/、canvas/、text/ → 同路径 | 移动/旋转/缩放、文本提交、指南线 |
| 音量、静音、分离、速度、保调 | media/audio.ts、speed/、retime/、commands/ → 同路径 | -6 dB、2x、保调、分离后音画导出 |
| 非特效关键帧、曲线 | animation/、params/、timeline/controllers/keyframe-drag-controller.ts、timeline/hooks/element/use-keyframe-*.ts → 同路径 | position X 0→100，Ease out，半秒插值 84 |
| 蒙版/羽化 | masks/、services/renderer/ → 同路径 | Ellipse、feather 10、导出逐帧对照 |
| 背景颜色/渐变/模糊 | background/、gradients/、services/renderer/ → 同路径，blur 改为内部专用 | 画布改 1:1、Medium blur、导出对照 |
| 书签、设置、布局、快捷键 | core/managers/timeline-document-manager.ts、timeline/bookmarks/、editor/、actions/ | 书签编辑与撤销、面板尺寸、宿主焦点 |
| SRT/ASS 导入与文字轨 | subtitles/、subtitles/components/assets-view.tsx → 同路径 | 中英文导入、ASS 警告、无转录 provider |
| 自动保存、恢复、导出、进度取消 | core/managers/、services/storage/、services/renderer/ → 同路径加适配器 | 默认本地及内存仓库、配额/缺失文件、MP4/WebM/取消 |
| 系统/本地/宿主字体 | fonts/ → fonts/service.ts 和 FontProvider | 本地 Inter、缺失提示、宿主字体加载 |

## 删除

抽离源码不包含 stickers、graphics（本地图形）、effects、transitions、adjustment 公共能力；无特效轨、特效参数或特效关键帧分支。Rust 不再打包通用特效注册器，仅保留背景模糊/蒙版羽化所需内部 GPU pass。

删除在线音效库/收藏、账号、数据库服务、Redis、CMS、官网、反馈、分析、更新通知及旧工程迁移。原版目录中的这些代码仅用于只读对照，不进入成品构建。

默认无外部网络服务。转录 provider、字体 provider 由宿主决定；默认不下载模型或在线字体。

## 原版占位入口

该固定版本素材面板没有搜索输入入口，未额外杜撰搜索UI。多场景功能已按用户要求完全删除，每个工程只有一条时间线；没有场景管理面板或创建、重命名、切换、删除接口。原版未实现的替换素材入口及拖放占位链路已按要求完整移除。ASS 复杂样式/标签并非完整播放器解释器，会使用原解析器提供的警告。导出当前工程的整条时间线。

## 有意的行为变化

- 一个活动实例与一个挂载视图的显式约束，代替隐式全局单例共享。
- 项目管理（列表、新建、重命名、复制、删除）和页面路由属于宿主，编辑器只负责打开一个项目、编辑、自动保存和导出，见 [project-management.md](project-management.md)。
- 存储/字体/转录失败通过实例通知和 Promise 暴露，不再依赖全局 Sonner 或业务服务。
- 新建/切换/销毁先处理保存与取消；未保存数据失败时阻止切换。
- 快捷键、粘贴限定编辑器区域；输入法组合不触发命令。
- 卸载视图保存当前播放头，以便重新挂载恢复。
- 图片加载失败移除失败缓存，允许 Retry；书签行外层从 button 改为 group，修复原版嵌套 button 的无效 DOM，指针处理不变。
- Base UI 适配保留原版明确禁止自动恢复焦点的控件行为；菜单/曲线浮层恢复触发器焦点。

工程格式为 version 2，直接保存 timeline.tracks 和 timeline.bookmarks。无旧格式兼容或迁移；此前本地演示数据按用户要求清空。

Freeze frame（定格）占位入口已完整删除。该版本只有工具栏禁用按钮、提示和空点击处理，无对应动作、快捷键、命令或 Rust 实现。

## 新增轨道管理

支持手动新增视频／图片、文字、音频空轨道（左上角 Add track 把新轨道追加到列表末尾，任何类型都一样），整轨删除，上下交换相邻轨道及右键在上方／下方插入。主动新增且未参与移动的空轨道保留，移动产生的源空轨道在同次提交清理；显示顺序随工程保存，预览与导出使用相同层级。轨道操作接入原命令历史。详见 [opencut-changes/features.md](opencut-changes/features.md)。

## 相对原版的改动台账

见 [OpenCut 改动索引](opencut-changes/README.md)，包含对话决策溯源、原版与当前行为、源码、验证和未实施方案。
