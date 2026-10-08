# 移除多场景管理

2026-09-30，按用户要求删除全部多场景功能，并按追加要求直接清空本地数据，不提供旧格式兼容。

## 实现

- 删除工具栏 Main scene 和叠层按钮、场景侧栏及仅它使用的 Sheet/SplitButton 封装。
- 删除创建、重命名、切换、删除场景的方法、命令和数组工具；删除 ScenesManager、TScene、SerializedScene、currentSceneId。
- TimelineDocumentManager 只保存当前工程的 timeline（tracks、bookmarks），无场景列表和活动场景。
- 书签命令迁到 commands/bookmark，保留原帧对齐、增删改、拖动与撤销重做算法；轨道、拖放、播放和渲染读单时间线。
- 工程格式 version 2 直接保存 timeline。旧版本明确拒绝，未添加转换、回退或迁移。素材仍按工程 ID 存储在原本地仓库。
- 字幕异步处理使用工程生命周期 generation 防止切换工程后误插入；不再依赖场景 ID。
- 渲染内部 buildScene/SceneExporter 表示合成渲染树，保留其音画渲染算法，与已删除的多场景工程管理无关。
- 原版 opencut/ 作为只读对照，不修改。Ad Genie 未修改。

## 数据清理

在 Chrome qingqing 配置的 127.0.0.1:5201 和 :5202 中，仅清理本项目 basic-video-editor / bve 命名空间。

- 首次 Vite：6 个 IndexedDB 数据库、4 个 OPFS 目录、9 项偏好。
- 首次 Next：9 个 IndexedDB 数据库、7 个 OPFS 目录、7 项偏好。
- 验收后再次清理测试生成的数据；清理页面均确认剩余项目数据库和素材目录为 0。
- 清理用的临时页面已删除，不进入最终示例构建或编辑器包。未修改 OpenCut 原站点、5210 或 Ad Genie 数据。

## 验证

- 101 项测试通过，新增 5 项覆盖书签命令撤销重做、轨道与书签序列化、运行时音频缓冲剔除、旧版本拒绝、工程隔离、保存失败及重试。
- 编辑器 TypeScript、ESM/CSS/WASM/声明文件构建及最终产物审计通过；审计增加多场景入口、命令、方法和类型残留检查。
- Vite / Next 示例生产构建通过；重新打包 tgz，独立 npm 消费者安装新包后类型检查和生产构建通过。压缩包 487 个 JS/类型/map 文件无已删除多场景符号。
- Chromium：20 次挂载、真实媒体导入、插入、撤销重做、保存、关闭、重开、卸载、销毁通过；每轮跟踪到的 Blob URL 和全局事件监听归零。额外检查配额失败、项目切换阻止、缺失素材和转录取消。范围限这些明确指标，不等于完整堆内存分析。
- Chromium 真实 MP4 导出 29,818 bytes、240×160、2.089796s；WebM 22,823 bytes、240×160、2s。两种结果通过浏览器加载元数据并 seek 到 1s 解码视频帧。MP4 含音频编码时长尾部；本次未做逐样本音频对齐对照。
- Next 生产示例：从系统文件选择器导入 timecode.mp4，真实鼠标拖放至主轨，书签点击/⌘Z撤销/⌘⇧Z重做、缩放加号通过；刷新恢复 6s 视频、书签和 0.519577 的缩放值，控制台无错误。
- 初次 Vite 测试命中旧开发服务器模块缓存，重启后验证新产物。验收脚本的播放头断言改为对照关闭时实际保存的值，避免把播放推进后的合法保存误报为缩略图覆盖。

证据：[20轮结果](evidence/single-timeline-lifecycle.txt)、[Next界面](evidence/single-timeline-editor.png)。截图是清理验收数据之前的记录。
