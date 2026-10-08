# 实施状态

> 历史验收记录已从仓库移除：交互验收基线、各项修复的实测记录、`docs/evidence/` 的截图/日志/对照视频和 `docs/fixtures/` 的测试素材。正文里提到这些文件名的地方保留为纯文字，原文件在首次提交 `5dcc3e5` 的 git 历史里，例如 `git show 5dcc3e5:docs/interaction-baseline.md`；取出整个目录用 `git checkout 5dcc3e5 -- docs/evidence`。

源：OpenCut cf5e79e919144200294fb9fed22a222592a0aeea。仍在验收阶段；未认定完整抽离完成。

- [x] 原仓库移入 opencut/，保留历史，源文件未修改。
- [x] 独立 pnpm workspace，编辑器ESM/类型/CSS/WASM产物。
- [x] 删除指定服务与特性，精简Rust并重建WASM。
- [x] Base UI组件迁移，删除Radix/Sonner直接依赖。
- [x] 存储/字体/转录接口和默认本地适配器。
- [x] 原版/抽离版四组真实MP4逐帧对照，音频对照；离线WebM。
- [x] Next实际构建产物消费，Next生产真实媒体导出（Vite示例已删除，历史验收记录保留）。
- [x] Chromium/Safari各20次真实媒体生命周期及失败/取消检查。
- [x] 独立npm消费者安装tgz、类型检查、生产构建和实际页面启动。
- [x] 最终依赖、构建引用和CSS隔离审计；101个测试通过。
- [x] 波纹删除、预览缩放平移、面板尺寸、颜色渐变、图片剪贴板粘贴对照。
- [x] 素材面板原生拖放故障修复；Vite、Next、宿主dialog内真实鼠标拖入，混合工程导出与刷新恢复。
- [ ] 系统文件原生拖放、真实OS输入法及未覆盖的复杂交互组合。
- [ ] Firefox能力与可用功能（首次协议接受等待用户确认）。

本次素材拖放故障及整体复查见 interaction-audit.md。实测细节、证据路径和当前限制见 interaction-baseline.md，不把源码存在或构建成功当成未执行交互的通过证据。

时间轴鼠标缩放的后续缺陷及修复见 zoom-fix.md。鼠标点击/拖动、加减、滚轮、键盘与刷新恢复已在实际页面验证。

项目管理已移出编辑器包（2026-10-08）：项目列表、新建/重命名/复制/删除、路由由宿主实现，编辑器只负责当前项目的打开、编辑、保存与导出。Next 示例在 `examples/next/app/` 提供完整的参考实现（`/` 列表、`/editor/<id>` 剪辑页）。Vite 示例已删除。来源和过程见 [project-browser.md](project-browser.md)。

按要求移除替换素材：菜单、拖放占位分支、目标片段命中／高亮及相关类型已清理。素材拖到已有片段区域走原轨道插入规则。详见 interaction-audit.md 的补充记录。

按要求完整删除多场景管理，使用 version 2 单时间线工程，无兼容迁移。两种演示的旧数据和本次验收数据均已清空。新的 Chromium 20 次循环、MP4/WebM 解码和 Next 交互验收见 single-timeline.md。

时间线缩略图现按原比例显示，删除原版强制 16:9 拉伸。实测与边界见 thumbnail-ratio.md。

2026-10-05：新增 [相对 OpenCut 的改动台账](opencut-changes/README.md)。轨道菜单增删／排序与最新片段移动源空轨清理分别记录，不混同整轨拖拽。

2026-10-05：修复换轨指示线纵向滚动偏移及关键帧展开行高遗漏；实测指示位置与落下位置一致，见 [指示线修复](opencut-changes/drop-indicator.md)。
