# 接口参考

编辑器有两层接口：

- **`<ProjectEditor>`（推荐）**：打开一个项目并管理整个编辑器会话，宿主不需要自己创建和销毁编辑器。
- **`createEditor()` + `<VideoEditor>`（底层）**：宿主自己管理编辑器实例。

怎么把它们放进你的项目见 [INTEGRATION.md](../INTEGRATION.md)；项目列表、新建、复制、删除见 [project-management.md](project-management.md)。

## ProjectEditor

```tsx
<ProjectEditor
  projectId={id}
  storageNamespace="my-app"
  onExit={() => router.push("/")}
  onExport={download}
/>
```

打开 `projectId` 对应的项目。组件创建编辑器、打开项目、显示加载图标和错误界面、自动保存，卸载时先保存再销毁；创建与销毁在包内串行化，兼容 React StrictMode。`projectId` 变化时在同一个编辑器上切换项目。

| 属性 | 作用 |
| --- | --- |
| `projectId` | 必填，要打开的项目 id |
| `storageNamespace` | 本地存储（IndexedDB / OPFS / 界面偏好）的命名空间。不同应用用不同值；项目列表页使用相同的值才能看到同一份数据 |
| `fallback` | 加载期间显示的内容，默认是居中的旋转图标 |
| `renderError(error)` | 替换默认的错误界面（项目不存在、存储失败） |
| `onReady(editor)` | 编辑器实例创建好后调用。实例由组件管理，**不要自己 `destroy()`** |
| `onSaved({ projectId })` | 一次自动保存完成 |
| `onDirtyChange(dirty)` | 出现或不再有未保存的修改，可用来显示「保存中 / 已保存」 |
| `onError(error)` | 创建、打开或自动保存失败 |
| `ref` | `ref.current.editor` 取得当前编辑器实例 |
| `fonts`、`transcription` | 自定义字体、转录提供方，见下文 |
| `repositories` | 高级：替换默认的浏览器存储。目前只有浏览器 IndexedDB 是受支持并验证过的方式 |
| 其余属性 | 同 `<VideoEditor>` |

同一页面只能有一个编辑器：不要同时渲染两个 `ProjectEditor`，也不要和手动 `createEditor` 混用。

## VideoEditor

渲染一个已经创建好的编辑器实例。

| 属性 | 作用 |
| --- | --- |
| `editor` | 必填，`createEditor` 返回的实例 |
| `theme` | `"light"` 或 `"dark"`，由宿主控制；或用 `defaultTheme` + `onThemeChange` |
| `appearance` | 覆盖主题 token，见 [theme.md](theme.md) |
| `density` | `"compact"`（默认）或 `"comfortable"` |
| `trimOnImport` | 导入含视频的文件时先弹出剪辑弹窗，默认 `true`。设为 `false` 则原样导入，见 [trimmer.md](trimmer.md#导入时剪辑) |
| `onExport` | 导出完成回调 `({ blob, filename })`，由宿主决定下载、上传或保存位置 |
| `onExit` | 点击菜单里的 Exit project 后调用（项目已保存并关闭），宿主在这里切换路由 |
| `topBar` | 顶部扩展区域 |
| `fallback` | 编辑器代码加载期间显示的内容，默认是居中的旋转图标 |
| `portalContainer` | 把菜单、对话框挂到宿主指定的容器（例如宿主的原生 `<dialog>` 内） |
| `className`、`style` | 外层容器样式；容器必须有明确高度，目前只支持桌面布局 |

一个实例只能挂载一个 `VideoEditor`。视图卸载会停止播放、导出和转录，但不销毁实例，因此可以重新挂载。

## createEditor 与实例

```ts
const editor = await createEditor({ storageNamespace: "my-app" });
await editor.openProject(id);        // 然后 <VideoEditor editor={editor} />
```

`createEditor(options)` 异步加载 WASM、浏览器引擎和本地字体，返回 `EditorInstance`。它只做初始化：此时不读取任何项目，真正的读写发生在后面的 `openProject`、自动保存和素材导入时。包入口在服务端渲染中不初始化浏览器 API，实例必须在客户端创建（Next 里用 `dynamic(..., { ssr: false })`）。

| 选项 | 作用 |
| --- | --- |
| `storageNamespace` | 同上，缺省 `basic-video-editor-v1` |
| `projects`、`assets` | 注入自定义存储仓库（高级，不是受支持的路径） |
| `fonts`、`transcription` | 字体、转录提供方 |

### 实例方法

| 调用 | 语义 |
| --- | --- |
| `newProject(name?)` | 保存并关闭旧工程，创建、保存并打开新工程，返回 ID |
| `openProject(id)` | 保存并关闭旧工程，再读取新工程和素材；项目不存在时拒绝 |
| `saveProject()` | 等待持久化完成；失败则拒绝，并保留未保存状态 |
| `closeProject({ discard? })` | 默认先保存；只有宿主明确选择 `discard` 才丢弃未保存修改 |
| `importMedia(File[])` | 处理并持久化素材，返回素材数组；存储失败的项返回 `null` 并发出通知 |
| `export(options, signal?)` | 返回结果 `Blob`；取消时以 `AbortError` 拒绝。不会自动下载 |
| `subscribe(listener)` | 订阅项目、时间线、素材、播放状态，返回取消订阅函数 |
| `destroy({ discard? })` | 默认先保存，停止活动并释放资源；可以重复调用 |

`ExportOptions`：`format: 'mp4' | 'webm'`、`quality: 'low' | 'medium' | 'high' | 'very_high'`、`includeAudio?`、`fps?`。帧率使用 `{ numerator, denominator }`；时间使用整数 tick（每秒 120000），不要把秒数直接当 tick。

高级扩展可以使用实例的 `timeline`、`command`、`project`、`document`、`selection`、`playback` 等管理器。它们沿用 OpenCut 的接口风格，参数类型随包提供。宿主应通过命令或管理器修改工程，不要直接修改状态对象；撤销分组和联动编辑沿用原实现。

### 生命周期规则

- **全局只能有一个活动实例**，第二个会被明确拒绝。创建新实例必须等旧实例 `destroy()` 完成。
- 离开页面时先卸载视图，再等待 `destroy()`；保存失败必须向用户显示，不能忽略。
- 新建、打开、关闭和销毁会取消当前导出和转录，并等待已开始的存储和媒体任务。自动保存失败时，切换工程会失败并保留当前工程；宿主要提供「放弃修改」应显式调用 `closeProject({ discard: true })`。
- 宿主使用自己的返回按钮（而不是编辑器菜单）时：先卸载剪辑视图，再 `await editor.project.prepareExit()` 和 `await editor.closeProject()`；保存失败时保留实例和未保存工程并显示错误。
- React StrictMode 的第一次 effect 需要能被取消。不要在 render 或服务端创建实例，也不要并发执行多次异步创建。

### 状态与通知

- `editor.save.getIsDirty()`、`editor.project.getExportState()`、`editor.project.getActiveOrNull()` 查询当前状态。
- `editor.save.subscribe(listener)` 订阅自动保存事件：`{ type: 'dirty', dirty }`、`{ type: 'saved', projectId }`、`{ type: 'error', error }`。`ProjectEditor` 的 `onDirtyChange`、`onSaved`、`onError` 就是基于它。
- `editor.notifications.subscribe(listener)` 传递通知事件；内置界面用 Base UI Toast 显示。
- 快捷键和粘贴只在编辑器根元素及浮层内生效，宿主输入框不会被接管；输入法组合期间不触发编辑器快捷键。

### 自定义浮层

宿主需要自己的浮层时，必须使用 `EditorUIContext` 中的 `portalContainer`，不能直接 `createPortal` 到 `document.body`。这个容器既提供 `.bve-scope` 样式与主题，也属于编辑器的事件范围。放进宿主原生 `<dialog>` 时，把 `portalContainer` 指向 dialog 内部元素。`pnpm audit:package` 会检查直接逃逸到 body 的自定义 portal。

## 项目数据

当前工程是单时间线格式（version 2）：`project.timeline` 包含 `tracks` 与 `bookmarks`；不存在多场景接口。旧格式不兼容，也不会自动迁移。

`await createProjectRecord({ name })` 返回一份可直接 `projects.save()` 的空项目记录，**不需要编辑器实例**（首次调用会加载 WASM 时间内核）。`editor.project.renameActiveProject({ name })` 只修改当前打开的项目，随自动保存落盘。

## 存储

编辑器需要的接口很小：

| 接口 | 方法 | 谁调用 |
| --- | --- | --- |
| `ProjectRepository` | `read(id)`、`save(project)` | 编辑器 |
| `AssetRepository` | `list(projectId)`、`read(projectId, id)`、`save(projectId, asset)`、`delete(projectId, id)` | 编辑器 |
| `ProjectStore`（扩展 `ProjectRepository`） | 另有 `list()`、`delete(id)` | **仅宿主的列表页**，编辑器从不调用 |
| `AssetStore`（扩展 `AssetRepository`） | 另有 `deleteProject(projectId)` | **仅宿主**，编辑器从不调用 |

完整签名见 `packages/editor/src/api/adapters.ts`。项目 JSON 是 `SerializedProject`，素材保存 `{ metadata, file }`；`metadata.id` 是稳定引用，临时 Blob URL 和 AudioBuffer 不持久化。

**目前只支持浏览器存储**：`createBrowserRepositories({ namespace })` 用 IndexedDB 存项目与素材元数据，用 OPFS 存素材二进制。OPFS 要求安全上下文（HTTPS 或 localhost）；不可用时直接显示错误，不会静默退回容易丢失的存储。`storageNamespace` 同时是界面偏好（面板布局、快捷键等）的前缀，即使注入了自定义仓库也需要提供。

```ts
// 项目列表页：直接用浏览器仓库
const { projects, assets } = createBrowserRepositories({ namespace: "my-app" });
// 剪辑页：默认就是同一份浏览器存储
<ProjectEditor projectId={id} storageNamespace="my-app" />
```

对自定义仓库的要求（`createEditor({ projects, assets })`，不是当前受支持的路径）：Promise 必须在写入真正提交后才 resolve，失败时 reject；找不到记录时 `read` 返回 `null`；不要吞掉配额或权限错误；单条记录的保存应是原子的。跨项目与素材的业务事务（例如复制项目和它的素材）由宿主设计。可运行的内存仓库和失败注入见 `tests/project-actions.test.ts`。

## 字体

默认使用系统字体加随包 Inter（400/700）。中文依赖系统字体回退；若需要跨设备完全一致，应提供覆盖对应字符的本地字体。

```ts
const fonts: FontProvider = {
  async list() {
    return [{ value: "Host Sans", label: "Host Sans", category: "custom", weights: [400] }];
  },
  async load(family) {
    if (family !== "Host Sans") throw new Error("Unknown font");
    return [await new FontFace(family, "url(/fonts/host-sans.woff2)").load()];
  },
};
```

返回的 `FontFace` 由编辑器注册，并在销毁时移除。宿主负责资源地址、授权和离线可用性。缺失的字体会通知并回退到 Inter，不会请求 Google Fonts；默认实现没有在线字体目录。

## 转录

没有 provider 时仍可导入 SRT/ASS，自动转录显示为未配置。ASS 中不支持的标签或事件效果会保留解析警告；它不是完整的 ASS 排版引擎。

```ts
const transcription: TranscriptionProvider = {
  async transcribe({ audioData, sampleRate, language, signal, onProgress }) {
    signal.throwIfAborted();
    onProgress?.({ status: "transcribing", progress: 0, message: "Preparing" });
    // 调用宿主自己的本地或远端实现，并把 signal 传下去。
    const segments = await myRecognizer({ audioData, sampleRate, language, signal });
    signal.throwIfAborted();
    return { text: segments.map((s) => s.text).join(" "), segments, language: language ?? "auto" };
  },
};
```

音频输入是单声道 `Float32Array`，字幕流程会重采样到 16000 Hz，以收到的 `sampleRate` 为准；segment 的 `start/end` 单位是秒。提供方必须响应 `AbortSignal` 并停止资源或网络工作；编辑器在切换工程、卸载、销毁时取消，且不会采用已取消任务的结果。包内不含 Transformers、Whisper Worker 或模型下载。

## 产物与 TypeScript

- `dist/index.js` 是 ESM 入口，`dist/types/` 是类型声明，`dist/style.css` 是预编译 CSS，WASM 作为相对 URL 资源输出。**部署时保留整个 `dist` 结构**，不要只复制 `index.js`。消费者不需要 Tailwind。
- 包是 `private`，不会发布到公共仓库：使用 pnpm workspace，或 `pnpm pack` 后交给私有制品流程。
- 打包后的类型声明已把 `@/` 别名转换为相对路径，并包含 `render-wasm` 的类型，宿主只需要安装 editor 一个包。
- 宿主建议开启 `skipLibCheck: true`。依赖 Mediabunny 1.29.1 引入的 `@types/dom-webcodecs` 与 TypeScript 5.8 的部分 DOM 声明重复，关闭后会报告重复的 `ImageBufferSource`；应用代码和编辑器接口仍然是严格类型检查。
- 修改编辑器后重新打包给宿主时，先递增包版本再安装，避免包管理器继续使用缓存里的旧 tgz。产物文件带内容哈希，覆盖 `dist` 后需要重启开发服务器并刷新页面。
