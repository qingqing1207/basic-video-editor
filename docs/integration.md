# 接口与生命周期

`createEditor(options)` 异步加载 WASM、浏览器引擎和本地字体，返回 `EditorInstance`。包入口在 SSR 中不初始化浏览器 API；实例必须在客户端创建。Next 示例通过 `dynamic(...,{ssr:false})` 建立边界。

## 实例操作

| 调用 | 语义 |
| --- | --- |
| `newProject(name?)` | 保存并关闭旧工程，创建新工程，返回 ID |
| `openProject(id)` | 保存并关闭旧工程，再读取新工程和素材 |
| `saveProject()` | 等待持久化完成；失败拒绝，保留 dirty |
| `closeProject({discard?})` | 默认先保存；只有宿主明确选择 discard 才丢弃未保存修改 |
| `importMedia(File[])` | 处理并持久化素材，返回素材数组；存储失败的项返回 null 并通知 |
| `export(options, signal?)` | 返回结果 Blob；取消时拒绝 AbortError |
| `subscribe(listener)` | 订阅项目、时间线、素材、播放状态；返回 unsubscribe |
| `destroy({discard?})` | 默认保存，停止活动并释放资源；可以重复调用 |

`ExportOptions` 包含 `format: 'mp4'|'webm'`、`quality: 'low'|'medium'|'high'|'very_high'`、`includeAudio?`、`fps?`。帧率使用 `{numerator,denominator}`，时间使用整数 tick（每秒 120000），不要将秒数直接当 tick。

高级扩展可使用实例的 `timeline`、`command`、`project`、`document`、`selection`、`playback` 等原管理器。这些仍是 OpenCut 风格接口，参数类型随包提供。宿主应通过命令/管理器修改工程，不直接修改状态对象。撤销分组和联动编辑沿用原实现。

## React 所有权

一个实例只能挂载一个 `VideoEditor`。视图卸载会停止播放、导出和转录，但不销毁实例，因此可以重新挂载。彻底离开宿主页时，先卸载视图，再等待 `destroy()`；失败必须向用户显示，不能忽略保存错误。新实例要在旧实例销毁完成后创建。

新建、打开、关闭和销毁会取消当前导出/转录并等待已开始的存储和媒体任务。自动保存失败时，切换工程会失败并保留当前工程。宿主若要提供“放弃修改”，应显式调用 `closeProject({discard:true})`。

React StrictMode 的 effect 探测需要取消初始化；两个示例展示了取消标记和 cleanup。不要在 render 或服务端创建实例，也不要把多次异步创建并发执行。

## 状态与通知

`editor.save.getIsDirty()`、`editor.project.getExportState()`、`editor.project.getActiveOrNull()` 可查询当前状态。`editor.notifications.subscribe(listener)` 传递通知事件；内置 React UI 使用 Base UI Toast 显示。

宿主回调 `VideoEditor.onExport({blob,filename})` 决定下载、上传或保存位置。实例 `export()` 不自动下载。顶部扩展区域为 `topBar`，布局由 `className`、`style` 和容器尺寸决定。

快捷键和粘贴按编辑器根元素及浮层限制；宿主输入框不应被接管。指针拖动仍使用必要的 document/window 监听，结束或卸载清理。输入法组合期间不触发编辑器快捷键。

## 产物

`dist/index.js` 是 ESM 入口；`dist/types/` 为类型声明；`dist/style.css` 为预编译 CSS；WASM 作为相对 URL 资源输出。部署时保留整个 dist 结构，不只复制 index.js。消费者不需要 Tailwind。

包设置 private，不会发布公共仓库。可以使用 pnpm workspace 引用，或 `pnpm pack` 后交由私有制品流程管理。不要只复制源码中的 `@/` 别名；打包后的类型声明已经转换为相对路径。

## 宿主引入方式

**打包引入（推荐）**：`import '@basic-video-editor/editor/style.css'` 加包入口，宿主不需要 Tailwind。
- 宿主只需安装 `@basic-video-editor/editor` 一个包。`render-wasm` 是构建期内部包（`devDependencies`）：运行时代码和 WASM 已打进 editor 的 `dist`，类型声明由 `scripts/fix-declaration-paths.mjs` 在构建时复制到 `dist/types/render-wasm/` 并改为相对引用。包本身仍是 private，用 workspace 或私有制品库（`pnpm pack` 的 tgz 即可）。
- 已在仓库外的干净 Vite + React 19 宿主验证：安装、`tsc --noEmit`、生产构建、运行，并在宿主里放了激进的全局样式（`button{...}`、`input{...}`、`*{box-sizing:content-box}`、`body` 字体）；编辑器外观不受影响，宿主元素也不受编辑器影响，`appearance` 与明暗切换正常。

**源码引入**：只在本工作区验证过（Next 示例，`BVE_SOURCE=1`）。源码里仍直接 import `@basic-video-editor/render-wasm`，所以宿主的工作区里也要有 `packages/render-wasm`（含构建好的 `dist`）。宿主必须自己配置三件事，不是“直接 import 源码”就能用：
1. `@/*` 路径别名指向 `packages/editor/src/*`（源码内部用它互相引用）；
2. 包入口别名：`@basic-video-editor/editor`、`/style.css`（指向 `src/react/style.css`）、`/theme-preview`；
3. 处理 `style.css` 的 PostCSS 流水线：用 `css-source-plugin.mjs`（内部依次是 `@tailwindcss/postcss` → `postcss-prefix-selector` → `css-namespace.mjs`，与 `packages/editor/css-build.config.mjs` 一致），它只对编辑器自己的样式入口生效。少了它样式不会被隔离、也没有 Tailwind 工具类。
Next 示例的 `next.config.mjs`、`postcss.config.mjs`、`tsconfig.json` 就是参考配置。

**非 monorepo、任意目录的宿主（源码引入，已在 npm + Next 16 单仓库验证）**：目录名不重要，不需要叫 `packages`，也不需要 pnpm。做法：
1. 把 `packages/editor/src`、`packages/editor/css-source-plugin.mjs`、`css-namespace.mjs`、`css-prefix.mjs` 复制到宿主，例如 `vendor/video-editor/`；把 `packages/render-wasm/dist` 复制到 `vendor/render-wasm/dist/`（去掉 `src/**/__tests__`）。
2. 宿主 `package.json` 手动加依赖：editor 的全部 `dependencies`，加 `@fontsource/inter`、`tailwindcss`、`@tailwindcss/typography`、`tailwindcss-animate`、`@tailwindcss/postcss`、`postcss`、`postcss-prefix-selector`，开发依赖加 `@types/culori`。react/react-dom 只能有宿主这一份。
3. `next.config.mjs` 的 `turbopack.resolveAlias` 把 `@basic-video-editor/editor`、`/style.css`、`@basic-video-editor/render-wasm` 指到上面的 vendor 路径；`postcss.config.mjs` 只注册 `vendor/video-editor/css-source-plugin.mjs`（它只处理编辑器自己的 `style.css`，宿主有自己的 Tailwind 4 时在其后再加 `@tailwindcss/postcss`）。不要把 `css-prefix`、`css-namespace` 直接放进全局插件列表，否则宿主自己的 CSS 会被加前缀、变量被改名。详见根目录 `INTEGRATION.md`。
4. `tsconfig.json` 必须有：`strict: true`、`target: ES2022`，以及 `paths`：`@/*`、`@basic-video-editor/editor`、`@basic-video-editor/render-wasm`（指向 `.d.ts`）。缺 `strict` 会让 `next build` 的类型检查对 vendor 源码报错；缺 paths 同样报找不到模块。`@/*` 会占用宿主自己的 `@/` 别名，宿主代码请用相对路径。
5. 页面里用 `dynamic(() => import("./editor"), { ssr: false })` 加载客户端组件。
验证结果：`next dev` 与 `next build` + `next start` 均通过，编辑器正常渲染，WASM 加载正常，样式限定在 `.bve-scope`、无 `@layer`。

**样式隔离**：产物里所有选择器都在 `.bve-scope` 下，变量、keyframes、`@property` 都有 `bve-` 前缀；`@layer` 在构建时被展开为普通规则。原因：宿主未放进任何层的全局 CSS（如 `button { ... }`）无论选择器多弱，都会压过层内样式；展开后靠 `.bve-scope .x` 的选择器优先级取胜。`pnpm audit:package` 会在出现 `@layer` 或未限定作用域的选择器时失败。仍然无法抵御宿主的 `!important` 和针对 `.bve-scope` 内部类名的覆盖。

## TypeScript 与开发构建

宿主建议使用 `skipLibCheck: true`（两个示例均如此）。当前固定的 Mediabunny 1.29.1 引入 `@types/dom-webcodecs`，与 TypeScript 5.8 的部分 DOM 声明重复；这属于依赖声明冲突，关闭 skipLibCheck 的独立消费者检查会报告重复的 ImageBufferSource。应用代码及编辑器接口仍进行严格类型检查。

修改编辑器源码后先 `pnpm build`，再重启示例开发服务器并刷新页面。产物文件带内容哈希，旧页面的动态模块不能在覆盖 dist 后继续使用。

重新生成相同版本的tgz时，包管理器可能继续使用旧缓存；正式提供给宿主时应递增包版本并重新安装，避免把旧代码误当成新产物。

## 项目管理属于宿主

编辑器包只负责「打开一个项目、编辑、自动保存、导出」。项目列表、搜索排序、多选、新建、重命名、复制、删除、项目信息，以及页面路由，都由宿主实现；包里没有项目管理 UI，也没有列表级 API。

**存储目前只支持浏览器的 IndexedDB 加 OPFS。** 列表页用 `createBrowserRepositories({ namespace })` 直接读写；剪辑页的 `<ProjectEditor storageNamespace={namespace} />` 用同一个命名空间，因此看到的是同一份数据。编辑器只会调用 `ProjectRepository` 的 `read/save` 和 `AssetRepository` 的 `list/read/save/delete`；`ProjectStore.list/delete` 与 `AssetStore.deleteProject` 是给宿主列表页用的，编辑器从不调用。`createEditor` 仍可以注入自定义仓库，但那不是目前支持和验证的路径。

**新建项目不需要编辑器实例。** `await createProjectRecord({ name })` 返回一份可直接 `projects.save()` 的空项目记录（首次调用会加载 WASM 时间内核），保存后跳转到剪辑页，由剪辑页 `editor.openProject(id)` 打开。`editor.newProject(name)` 仍然保留，是「创建、保存并打开」的快捷方式。

**列表页不创建编辑器实例**，所以不加载 WASM 和渲染引擎，也不受「全局只能有一个编辑器」的限制。

**剪辑页用 `<ProjectEditor>`。** 它创建编辑器、`openProject(projectId)`、显示加载图标和错误界面、自动保存、卸载时先保存再销毁，创建与销毁在包内串行化，并兼容 StrictMode。`projectId` 变化时在同一个编辑器上切换项目。项目不存在时显示错误界面（`renderError` 可替换）并调用 `onError`。Exit project 菜单会保存并关闭项目，然后调用 `onExit`，宿主在这里切换路由。保存状态通过 `onDirtyChange`、`onSaved`、`onError` 通知宿主。当前工程的名称由头部直接编辑，随自动保存写入（`editor.project.renameActiveProject({ name })`）。

需要自己管理实例（例如在编辑器外读写当前项目）时，才直接用 `createEditor` + `<VideoEditor>`；两种方式不要混用，页面上也只能有一个编辑器。

参考实现在 `examples/next/app/`：

| 文件 | 作用 |
| --- | --- |
| `lib/repositories.ts` | 创建并共享浏览器仓库、存储命名空间 |
| `lib/project-actions.ts` | 列表、过滤排序、重命名、复制（含素材，先复制素材再提交记录，失败回滚）、删除（先删素材再删记录） |
| `components/projects-screen.tsx` | 列表页：网格/列表、搜索、排序、多选（含 shift 范围）、右键菜单、重命名/删除/信息对话框 |
| `components/editor-view.tsx` | 剪辑页：一个 `<ProjectEditor>`，加上宿主的路由、下载和错误界面 |
| `app/page.tsx`、`app/editor/[id]/page.tsx` | 真实路由 `/` 与 `/editor/<id>` |

列表页的删除需要输入 `DELETE` 确认。示例的列表页用宿主自己的 Tailwind 样式，与编辑器的主题 token 无关。

宿主使用自己的返回按钮时，先卸载剪辑视图，再 `await editor.project.prepareExit()` 和 `await editor.closeProject()`；保存失败须保留实例和未保存工程并显示错误。

自定义浮层必须使用EditorUIContext中的portalContainer，不能直接createPortal到document.body。这个容器既提供.bve-scope样式与主题，也属于编辑器的事件范围；宿主原生dialog中应将外层portalContainer放在dialog内部。pnpm audit:package会检查直接逃逸到body的自定义portal。

当前工程是单时间线格式（version 2）：`project.timeline` 包含 `tracks` 与 `bookmarks`。`editor.document` 管理当前工程的时间线数据和书签；不存在多场景 API。旧格式不兼容，也不执行自动数据迁移。
