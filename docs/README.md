# 文档索引

入口在仓库根目录：[README.md](../README.md) 介绍项目和本地运行，[INTEGRATION.md](../INTEGRATION.md) 说明怎么把编辑器放进你的项目。

## 使用

| 文档 | 内容 |
| --- | --- |
| [api.md](api.md) | 接口参考：`ProjectEditor` / `VideoEditor` 属性、`createEditor` 和实例方法、生命周期规则、自动保存事件、存储接口、字体与转录提供方、产物与 TypeScript |
| [trimmer.md](trimmer.md) | 视频裁剪组件 `VideoTrimmer` 和 `trimVideo`：属性、交互、输出文件、限制 |
| [project-management.md](project-management.md) | 宿主侧的项目管理：列表、新建、重命名、复制、删除，数据从哪里来，参考实现 |
| [theme.md](theme.md) | 主题系统：`theme` / `density` / `appearance`、token 三层架构、Tailwind 映射、视觉规范、样式隔离 |
| [theme-tokens.md](theme-tokens.md) | 全部 token 清单（由 `scripts/generate-theme.mjs` 自动生成，不要手改） |

## 维护

| 文档 | 内容 |
| --- | --- |
| [wasm.md](wasm.md) | 重建 WASM 的工具链和步骤 |
| [status.md](status.md) | 已完成与未完成、各引入方式的验证状态、已知设计限制 |
| [features.md](features.md) | 保留、删除和新增的功能，以及与原版源码的对应关系 |
| [licenses.md](licenses.md) | 来源与许可 |

## 变更台账

[opencut-changes/](opencut-changes/README.md) 记录相对 OpenCut 的改动：用户需求溯源、原版行为与当前行为、源码入口、验证和限制。

| 文档 | 内容 |
| --- | --- |
| [features.md](opencut-changes/features.md) | 功能增强与界面调整 |
| [extraction.md](opencut-changes/extraction.md) | 本地化、封装与明确删除的功能 |
| [regressions.md](opencut-changes/regressions.md) | 迁移过程中发现并修复的回归 |
| [track-move-cleanup.md](opencut-changes/track-move-cleanup.md) | 移动后原子清理源空轨道 |
| [drop-indicator.md](opencut-changes/drop-indicator.md) | 拖动插入指示线与落点对齐 |
| [theme-system.md](opencut-changes/theme-system.md) | 统一主题系统，以及 token 收敛与样式改版 |
| [project-management.md](opencut-changes/project-management.md) | 项目管理移出编辑器包 |
