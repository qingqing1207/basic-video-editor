# Local video editor

从 OpenCut `cf5e79e919144200294fb9fed22a222592a0aeea` 抽离的 React 19 本地视频剪辑台。原版保存在 `opencut/`，应用和构建不依赖该目录。采用 Base UI，保留原时间线控制器、命令系统和渲染算法。

**怎么集成到你的项目（Next 源码引入、打包引入、主题、验证状态）见 [INTEGRATION.md](INTEGRATION.md)。**

当前验收进度及未验证边界见 [交互记录](docs/interaction-baseline.md) 和 [实施状态](docs/status.md)。不要把构建成功等同于全部交互已经验收。

## 本地运行

环境：Node 24.12.0、pnpm 10.32.1。使用 `pnpm install --frozen-lockfile`，然后：

```sh
pnpm build
pnpm dev
```

`packages/render-wasm/dist` 是本项目精简源码生成的 WASM。修改 Rust 后按 [WASM 重建](docs/wasm.md) 运行 `pnpm build:wasm`，再构建编辑器。普通宿主集成不需要 Rust。

```sh
pnpm typecheck
pnpm test
pnpm build:examples
pnpm --filter @basic-video-editor/next-demo start --port 5202
```

`pnpm dev` 启动 Next 示例（`http://127.0.0.1:5202`）：`/` 是项目列表页，`/editor/<id>` 是剪辑页，`/theme` 是主题验收页。**项目管理（列表、搜索、排序、多选、新建、重命名、复制、删除、项目信息）和页面路由属于宿主**，示例里在 `examples/next/app/` 自己实现；编辑器包只负责打开一个项目、编辑、自动保存和导出。剪辑页左上角菜单的 **Exit project** 保存并关闭项目后调用宿主的 `onExit`，示例据此回到列表。

Next 示例的 `pnpm dev` 直接编译 `packages/editor/src`（`BVE_SOURCE=1`），`pnpm dev:dist` 才使用 `dist`；`dist` 模式下库重建后要重启开发服务器并刷新页面。热替换运行中的媒体引擎不属于支持的生命周期。

## 接入

```tsx
import { createEditor, VideoEditor } from '@basic-video-editor/editor';
import '@basic-video-editor/editor/style.css';

// 仅在浏览器中创建；完整 React 生命周期例子见 examples/。
const editor = await createEditor({ storageNamespace: 'my-product-editor-v1' });
await editor.newProject('My project');
// 在明确高度的容器中渲染：
<VideoEditor editor={editor} theme="dark" onExport={({ blob, filename }) => {
  // 由宿主下载或上传。库不假设业务后端。
}} />;
// 先卸载 React 视图，再 await editor.destroy()。
```

- [API、生命周期和集成](docs/integration.md)
- [存储、字体、字幕适配](docs/adapters.md)
- [样式与宿主浮层](docs/theme.md)
- [功能边界与来源对应](docs/features.md)
- [相对 OpenCut 的改动台账](docs/opencut-changes/README.md)
- [许可和第三方来源](docs/licenses.md)

只支持一个活动编辑器实例；第二个实例会明确拒绝。项目使用独立版本 2 单时间线格式和存储空间，不读取、迁移或清理 OpenCut 原版数据。文件默认保存在本机浏览器的 IndexedDB 和 OPFS 中。桌面 Chromium 是完整验收目标；其他浏览器按运行时编解码/GPU 能力降级，详见验收记录。

## 本地安装产物

`artifacts/` 里的 `.tgz` 是历史产物，可能已过期。现在宿主只需要安装 editor 一个包（`render-wasm` 已作为内部实现打进去），重新打包的步骤见 [INTEGRATION.md](INTEGRATION.md)。

```sh
pnpm audit:package
```

开发验收页：Next 示例的 `/theme` 验证主题、token、原生 dialog 内的外置浮层，以及宿主样式与编辑器样式互不影响。它是验收工具，不属于编辑器包的产品界面。
