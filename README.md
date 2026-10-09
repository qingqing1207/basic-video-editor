# Local video editor

从 [OpenCut](https://github.com/OpenCut-app/OpenCut)（固定提交 `cf5e79e919144200294fb9fed22a222592a0aeea`）抽离的 React 19 本地视频剪辑台：采用 Base UI 和 Tailwind 4，保留原版的时间线控制器、命令系统和渲染算法，渲染与时间内核是 Rust 编译的 WASM。

- 只保留本地剪辑能力，默认没有任何网络服务；项目和素材存在浏览器的 IndexedDB 与 OPFS 里。
- **编辑器只负责「打开一个项目、编辑、自动保存、导出」**；项目列表、新建、复制、删除和页面路由由宿主实现，`examples/next/app/` 是完整的参考实现。
- 可以放进 Next 项目（源码引入或打包引入），样式隔离在 `.bve-scope` 内，主题通过 token 定制。

整体仍在验收阶段，构建成功不等于全部交互已经验收，见 [docs/status.md](docs/status.md)。

## 文档

| 想做什么 | 看哪里 |
| --- | --- |
| 把编辑器放进我的项目 | [INTEGRATION.md](INTEGRATION.md) |
| 查属性、事件、生命周期、存储、字体、转录 | [docs/api.md](docs/api.md) |
| 做项目列表、新建、复制、删除 | [docs/project-management.md](docs/project-management.md) |
| 让用户从上传的视频里截取一段 | [docs/trimmer.md](docs/trimmer.md) |
| 定制外观、改主题 token | [docs/theme.md](docs/theme.md) |
| 了解验收状态和已知限制 | [docs/status.md](docs/status.md) |
| 全部文档 | [docs/README.md](docs/README.md) |

## 本地运行

环境：Node 24.12.0、pnpm 10.32.1。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 启动 Next 示例 `http://127.0.0.1:5202`：`/` 是项目列表，`/editor/<id>` 是剪辑页，`/theme` 是主题验收页。它直接编译 `packages/editor/src`（`BVE_SOURCE=1`），改源码会热更新；`pnpm --filter @basic-video-editor/next-demo dev:dist` 改用打包产物 `dist`，库重建后需要重启开发服务器并刷新页面。

```sh
pnpm typecheck         # 编辑器类型检查
pnpm test              # 单元测试
pnpm build             # 构建编辑器包（含主题生成、WASM 复制、类型声明）
pnpm build:examples    # 构建 Next 示例
pnpm audit:package     # 检查产物：CSS 作用域、依赖、WASM、类型
```

`packages/render-wasm/dist` 是随仓库提交的 WASM 构建产物，普通使用不需要 Rust。改了 Rust 之后按 [docs/wasm.md](docs/wasm.md) 运行 `pnpm build:wasm`。

## 最小用法

```tsx
import { ProjectEditor } from "@basic-video-editor/editor";
import "@basic-video-editor/editor/style.css";

<div style={{ height: "100vh" }}>
  <ProjectEditor projectId={id} storageNamespace="my-app" onExit={() => router.push("/")} />
</div>
```

编辑器只能在浏览器里创建（Next 里用 `dynamic(..., { ssr: false })`）；容器需要明确的高度；同一页面只能有一个编辑器。完整步骤见 [INTEGRATION.md](INTEGRATION.md)。

## 仓库结构

| 目录 | 内容 |
| --- | --- |
| `packages/editor` | 编辑器包（React 组件、时间线、命令、渲染、存储、主题） |
| `packages/render-wasm` | Rust 源码和 WASM 构建产物（编辑器的内部依赖，宿主不需要单独安装） |
| `examples/next` | Next 示例宿主：项目列表、剪辑页、主题验收页 |
| `examples/shared` | 示例共用代码（主题验收页、预设） |
| `scripts` | 主题生成、产物审计、WASM 构建、类型声明修复 |
| `tests` | 跨模块的单元测试 |
| `docs` | 文档，索引见 [docs/README.md](docs/README.md) |
| `opencut/` | 原版 OpenCut 的只读本地参照，不随本仓库提交，构建和运行不依赖它 |

## 约束与来源

- 只支持一个活动编辑器实例；工程使用独立的 version 2 单时间线格式，不读取、迁移或清理 OpenCut 原版数据。
- 桌面 Chromium 是完整验收目标；其他浏览器按运行时的编解码和 GPU 能力降级。
- 包是 `private`，没有发布到公共仓库，打包和分发见 [INTEGRATION.md](INTEGRATION.md#3-方式-b打包引入)。
- 许可与第三方来源见 [docs/licenses.md](docs/licenses.md)；相对 OpenCut 的改动见 [docs/opencut-changes/README.md](docs/opencut-changes/README.md)。
