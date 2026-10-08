# 项目管理（宿主侧）

项目列表和项目管理**不属于编辑器包**。编辑器只提供「打开一个项目、编辑、自动保存、导出」；列表、搜索、排序、多选、新建、重命名、复制、删除、项目信息和页面路由由宿主实现。

## 历史

早期抽离版把 OpenCut 的项目页做成了包内组件 `ProjectBrowser`，并让 `ProjectManager` 承担列表、复制、删除等列表级逻辑，因此列表页必须先创建编辑器实例。2026-10-08 改造：

- 删除 `ProjectBrowser`、`project/browser/*`、列表用的重命名/删除/信息对话框，以及 `ProjectManager` / `StorageService` 里的列表级方法（`loadAllProjects`、`getSavedProjects`、`deleteProjects`、`duplicateProjects`、`renameProject(id)`、排序过滤、非法 id 记录）。
- 存储接口拆分：编辑器只需要 `ProjectRepository`（`read/save`）和 `AssetRepository`（`list/read/save/delete`）；列表用的 `list/delete/deleteProject` 放在可选的 `ProjectStore` / `AssetStore`，编辑器从不调用。
- 新增 `createProjectRecord({ name })`（新建项目不需要编辑器实例）和 `editor.project.renameActiveProject({ name })`（只改当前项目）。序列化/反序列化抽到 `services/storage/serialization.ts`。
- 偏好设置不再重置列表页的视图模式；宿主自己保存。

## 宿主要做什么

1. 列表页创建仓库：`createBrowserRepositories({ namespace })`（目前只支持浏览器存储）。剪辑页的 `storageNamespace` 用同一个值。
2. 列表页只用仓库，不创建编辑器：`projects.list()` 取列表，缩略图和时长都在 `metadata` 里（时长单位是 tick，每秒 120000）。
3. 新建：`const record = await createProjectRecord({ name })`，`await projects.save(record)`，跳转到剪辑页。
4. 复制：读取项目记录，换 id 和名字，先把素材从旧项目复制到新项目，**全部成功后再保存记录**；失败要删除已复制的素材。
5. 删除：先删素材（`assets.deleteProject(id)`），成功后再删记录。素材删除失败时保留记录。
6. 剪辑页：渲染 `<ProjectEditor projectId={id} storageNamespace={namespace} onExit={...} />`。创建、打开、自动保存、串行销毁、项目不存在时的错误界面都由它处理；`onExit` 里切换路由。

## 参考实现（Next 示例）

位于 `examples/next/app/`（含共享会话 hook 约 1000 行），使用宿主自己的 Tailwind 样式：

- `lib/project-actions.ts`：列表、过滤排序、重命名、复制、删除，纯函数，依赖注入仓库，有单元测试（`tests/project-actions.test.ts`）。
- `components/projects-screen.tsx`：网格/列表切换、搜索、按创建/修改/名称/时长排序及升降序、全选（含半选）、shift 范围多选、批量复制/删除、右键菜单和「…」菜单（重命名/复制/信息/删除）、重命名/删除（需输入 `DELETE`）/信息对话框、骨架屏、「无项目」和「无搜索结果」空状态、错误提示。视图模式和排序保存在宿主自己的 localStorage。
- `components/editor-view.tsx`：剪辑页，一个 `<ProjectEditor>` 加宿主的路由、下载和错误界面。
- `app/page.tsx`、`app/editor/[id]/page.tsx`：路由。

与改造前相比有意改变的行为：删除对话框原来显示「Type "DELETE" to confirm」但并不校验，现在必须输入 `DELETE` 才能确认。
