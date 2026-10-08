# 项目管理（宿主侧）

**项目列表和项目管理不属于编辑器包。** 编辑器只提供「打开一个项目、编辑、自动保存、导出」；列表、搜索、排序、多选、新建、重命名、复制、删除、项目信息和页面路由由宿主实现。

宿主需要做两个页面：

| 页面 | 做什么 | 是否需要编辑器实例 |
| --- | --- | --- |
| 项目列表页 | 用仓库列出、搜索、新建、重命名、复制、删除项目 | **不需要**，不加载 WASM 和渲染引擎 |
| 剪辑页 | 渲染 `<ProjectEditor projectId={id} />` | 由组件在内部创建 |

## 数据从哪里来

存储是浏览器的 IndexedDB 加 OPFS（目前只支持这一种）。列表页和剪辑页使用**同一个 `namespace`**，看到的就是同一份数据：

```ts
// 列表页
const { projects, assets } = createBrowserRepositories({ namespace: "my-app" });
// 剪辑页
<ProjectEditor projectId={id} storageNamespace="my-app" />
```

- 列表：`projects.list()` 返回所有项目的 `SerializedProject`，卡片需要的名字、缩略图（PNG data URL）、时长、创建和修改时间都在 `metadata` 里。时长单位是 tick，每秒 120000。
- 缩略图和时长由编辑器在编辑和退出时写进项目元数据，列表页不需要编辑器就能显示它们。
- `ProjectStore.list/delete` 和 `AssetStore.deleteProject` 只给宿主用，编辑器从不调用它们。接口见 [api.md](api.md#存储)。

## 各项操作

1. **新建**：`const record = await createProjectRecord({ name })`，`await projects.save(record)`，跳转到 `/editor/${record.metadata.id}`。不需要编辑器实例；首次调用会加载 WASM 时间内核。
2. **打开**：剪辑页渲染 `<ProjectEditor projectId={id} storageNamespace={namespace} onExit={...} />`。创建编辑器、打开项目、自动保存、串行销毁、项目不存在时的错误界面都由它处理。
3. **退出**：用户点菜单里的 Exit project，编辑器保存并关闭项目后调用 `onExit`，宿主在这里切换路由。保存状态通过 `onDirtyChange`、`onSaved`、`onError` 通知宿主。
4. **重命名**：列表页直接读取记录、改名、保存。当前打开的项目在剪辑页头部直接编辑，随自动保存落盘。
5. **复制**：读取项目记录，换 id 和名字（`(n) 原名`，n 取现有最大值加一），先把素材从旧项目复制到新项目，**全部成功后再保存记录**；失败时删除已经复制的素材。
6. **删除**：先删素材（`assets.deleteProject(id)`），成功后再删记录；素材删除失败时保留记录。

同一时刻只能有一个编辑器实例，所以页面上不要同时放两个 `ProjectEditor`。

## 参考实现

`examples/next/app/`，使用宿主自己的 Tailwind 样式（与编辑器的主题 token 无关）：

| 文件 | 作用 |
| --- | --- |
| `lib/repositories.ts` | 创建并共享浏览器仓库、存储命名空间 |
| `lib/project-actions.ts` | 列表、过滤排序、重命名、复制、删除；纯函数、依赖注入仓库，有单元测试 `tests/project-actions.test.ts` |
| `lib/use-list-prefs.ts` | 视图模式和排序的偏好（宿主自己的 localStorage） |
| `components/projects-screen.tsx` | 列表页：网格/列表切换、搜索、按创建/修改/名称/时长排序及升降序、全选（含半选）、shift 范围多选、批量复制/删除、右键菜单和「…」菜单（重命名/复制/信息/删除）、重命名/删除/信息对话框、骨架屏、「无项目」和「无搜索结果」空状态、错误提示 |
| `components/editor-view.tsx` | 剪辑页：一个 `<ProjectEditor>`，加宿主的路由、下载和错误界面 |
| `app/page.tsx`、`app/editor/[id]/page.tsx` | 路由 `/` 与 `/editor/<id>` |

列表页的删除需要输入 `DELETE` 才能确认。

## 已知限制

- `projects.list()` 读取所有项目的完整记录，其中缩略图是整帧 PNG 的 data URL，约占单条记录体积的 97%。项目很多时列表会变重，自动保存每次也会重写它。
- 自动保存是整份覆盖，没有版本或冲突检测：两个标签页同时编辑同一个项目会互相覆盖。
- 数据只在本机浏览器中，换设备或清除站点数据就会丢失。

这些限制的来由和改造方向见 [status.md](status.md)。
