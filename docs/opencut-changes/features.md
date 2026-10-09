# 功能增强与界面调整

本文件是当前行为对照；历史测试的具体日期、素材与证据见链接的原记录。

## 1. 时间线图片／视频缩略图按原比例显示

- 需求来源：用户指出竖版图片和视频在时间线中被拉宽。
- 原版：`timeline/components/timeline-element.tsx` 的 `THUMBNAIL_ASPECT_RATIO = 16 / 9`，按固定宽高设置背景图尺寸，所有素材套用同一比例。
- 我们：`TiledMediaContent` 使用 `background-size: auto 100%`，按轨道高度等比缩放并水平重复，末尾不足一张的区域裁切。素材本身不拉伸，片段宽度仍代表时长。
- 适用范围：图片与视频时间线平铺缩略图，包含横版、竖版和短片段；不改变画布变换、导出比例或时长计算。
- 边界：视频仍重复既有缩略图，未新增沿时间轴逐帧／间隔抽帧功能。
- 源码：[timeline-element.tsx](../../packages/editor/src/timeline/components/timeline-element.tsx)；[原版](../../opencut/apps/web/src/timeline/components/timeline-element.tsx)。
- 验证：比例修复记录；既有浏览器截图。

## 2. 轨道直接新增、删除、上移和下移

- 需求来源：用户指出没有直接增删轨道和向下换位的入口。
- 原版：overlay/main/audio 分区排列，轨道主要随素材放入而创建；命令后的 reactor 会清理空 overlay/audio，无法稳定保留手动新增空轨道。
- 我们：左上 Add track 新增视频／图片、文字、音频空轨，默认追加到列表末尾（早期版本沿用原版规则：视频、文字轨插在主轨道上方，只有音频轨在末尾，看起来像插到了中间）；每条轨道的 `…` 和空白区域右键提供上移、下移、上方／下方新增以及删除。不是新建轨道拖动手柄。
- 排序：新增持久化 `TimelineTracks.order`。轨道行、标签、拖放、组移动、粘贴、合成渲染和画布命中采用同一显示顺序；越靠上的视觉轨越靠前显示。
- 删除：删除整轨及片段，不删除素材库源文件；选择状态与撤销一起处理。主视频轨删除时提升已有视频轨，删除最后视频轨仍保留一个空视频锚点，这是当前数据结构的限制。
- 保留空轨：手动新增且未参与移动的空轨不会被全局清理。本次移动产生的源空轨按下一项处理。
- 源码：[track-actions.tsx](../../packages/editor/src/timeline/components/track-actions.tsx)、[track-order.ts](../../packages/editor/src/timeline/track-order.ts)、[轨道命令](../../packages/editor/src/commands/timeline/track/)。
- 验证：既有轨道管理记录，包括 Chromium/Vite/Next、真实 MP4/WebM 及合成顺序检查。

## 3. 片段跨轨移动不再堆积源空轨道

单选、多选，以及联动模式下本次实际移动的所有源轨道统一判断：移动后为空就清理，非空则保留。移动、清理、主轨转移作为一个命令结果提交，不改变原插入线、吸附、碰撞分配或新建轨道规则。

这也是对第 2 项移除全局清理后造成的回归修复；不能描述成“原版完全没有空轨清理”。详见 [规则、实现和验收](./track-move-cleanup.md)。

## 4. 独立项目管理页面及项目操作补齐（现由宿主实现）

- 需求来源：用户要求参考原版项目页，移除剪辑页面顶部的 demo 按钮条。
- 原版已有：项目网格／列表、搜索排序、多选、卡片与操作菜单；这些主要是复用，不是我们从零新增。
- 当时的封装：可选 `ProjectBrowser` 与 `VideoEditor` 共用实例，由宿主控制页面导航，新建、打开、重命名、复制、删除在项目页操作，Exit project 保存并返回项目页。**2026-10-08 起项目页移出编辑器包，由 Next 示例自己实现**，见 [项目管理移出编辑器包](./project-management.md)。
- 我们补齐：DELETE 确认实际约束提交；重命名同步最新值、拒绝空名称、输入法组合期间 Enter 不提交；菜单／弹窗焦点与 Base UI 复选框适配。
- 复制与失败：复制媒体后提交工程记录，副本使用独立工程 ID；失败清理已复制媒体、释放 Blob URL；删除／重命名错误反馈给页面。跨仓库批量操作不保证事务回滚。
- 源码：现在是 `examples/next/app/`（说明见 [project-management.md](../project-management.md)）；原版项目页是 `opencut/apps/web/src/app/projects/page.tsx`（本地只读参照，不随仓库提交）。
- 验证：见 [项目管理移出编辑器包](./project-management.md)。此前永久删除的最终 UI 点击未执行，底层成功／失败路径有测试；不把确认弹窗验证写成永久删除 UI 全流程通过。

## 5. 导入视频时先剪辑

- **需求**：用户导入视频时，可以先在弹窗里选出真正想要的片段；弹窗有 Reset 恢复整段；一次导入多个视频时可以切换，并一次性确认全部。
- **原版行为**：选好文件后直接入库，没有任何处理。
- **当前行为**：含视频的导入先弹出剪辑弹窗，确认后改过的视频裁成新文件再入库，其余原样入库；取消则整批不导入。可用 `trimOnImport={false}` 关闭。
- **入口**：`media/import-trim.ts`、`components/editor/import-trim-dialog.tsx`；三处导入入口分别在 `components/editor/panels/assets/views/assets.tsx`、`timeline/controllers/drag-drop-controller.ts`、`media/use-paste-media.ts`。裁剪组件见 [trimmer.md](../trimmer.md)。
- **验证**：浏览器里用 3 个视频加 1 张图片导入，切换、保留选区、Reset、Import all 和 Cancel 都符合预期；`requestImportTrim` 有单元测试。时间线拖入和粘贴两个入口只改了同样的调用，没有逐个手动验证。
