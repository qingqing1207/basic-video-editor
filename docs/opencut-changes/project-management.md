# 项目管理移出编辑器包

日期：2026-10-08。来源：用户认为「剪辑台应该比较纯粹，不包含页面、项目管理，页面和项目管理应该是宿主去处理」，要求把项目管理移到 Next 示例的页面里，剪辑台页面也是 Next 里自己的页面去引入组件。

## 原来的行为

早期抽离版把 OpenCut 的项目页做成包内组件 `ProjectBrowser`，`ProjectManager` 和 `StorageService` 承担列表、复制、删除等列表级逻辑，因此列表页必须先创建编辑器实例（加载 WASM 和渲染引擎）。示例通过 hash 路由在同一个壳里切换列表和编辑器，并同时提供 Vite 与 Next 两个示例。

## 改造后

- 删除 `ProjectBrowser`、`project/browser/*`、列表用的重命名/删除/信息对话框，以及 `ProjectManager` / `StorageService` 里的列表级方法（`loadAllProjects`、`getSavedProjects`、`deleteProjects`、`duplicateProjects`、`renameProject(id)`、排序过滤、非法 id 记录）。
- 存储接口拆分：编辑器只需要 `ProjectRepository`（`read/save`）和 `AssetRepository`（`list/read/save/delete`）；列表用的 `list/delete/deleteProject` 放在可选的 `ProjectStore` / `AssetStore`，编辑器从不调用。
- 新增 `createProjectRecord({ name })`（新建项目不需要编辑器实例）、`editor.project.renameActiveProject({ name })`（只改当前项目）。序列化与反序列化抽到 `services/storage/serialization.ts`。
- 偏好设置不再重置列表页的视图模式，由宿主自己保存。
- 新增高层组件 `ProjectEditor`：创建编辑器、打开项目、自动保存、串行销毁、加载与错误界面、StrictMode，宿主不再手写会话 hook；自动保存新增 `editor.save.subscribe` 事件（dirty / saved / error）。`VideoEditor` 新增 `fallback`，原来的 `Loading editor…` 文字换成居中图标。
- Next 示例用真实路由：`/` 列表页、`/editor/[id]` 剪辑页；列表页用宿主自己的 Tailwind 样式重写，功能与原版一致。**Vite 示例整个删除。**
- 示例页面不再依赖编辑器的 UI 组件库，也不再使用编辑器的主题 token。

## 有意变化的行为

- 删除对话框原来显示 `Type "DELETE" to confirm` 但并不校验，现在必须输入 `DELETE` 才能确认。
- 列表页不再创建编辑器实例，打开列表不加载 WASM。

## 验证

单元测试覆盖：复制（先复制素材再提交记录、失败回滚、编号规则）、删除（素材删除失败保留记录）、重命名、新建记录的序列化往返、自动保存事件、串行队列。浏览器中验证了列表的全部操作（搜索、排序、全选、shift 范围选择、右键菜单、重命名、复制、信息、删除）、新建→编辑→自动保存→退出、项目切换、不存在的项目，以及开发和生产两种模式。仍未做：用真实视频素材复制项目。
