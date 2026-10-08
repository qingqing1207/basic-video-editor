# 集成指南

怎么把这个视频剪辑台放进你的项目。**主推：Next.js + 源码引入**；不改编辑器、只想用时用打包引入。

接口和属性见 [docs/api.md](docs/api.md)，项目列表与新建/复制/删除见 [docs/project-management.md](docs/project-management.md)，主题见 [docs/theme.md](docs/theme.md)。各方式的验证状态见 [docs/status.md](docs/status.md#各引入方式的验证状态)，没有标「已验证」的不要当作可用。

## 0. 先选方式

| 方式 | 适合 | 状态 |
| --- | --- | --- |
| **A. Next 源码引入（推荐）** | 要改编辑器源码、调样式、跟着仓库迭代 | 已验证：本仓库内；任意普通 npm 单仓库 Next 16 项目（`dev`、`build`、`start`） |
| B. 打包引入（tgz） | 不改编辑器，只想用 | 已验证：干净的 Vite + React 19 宿主（pnpm；npm 为较早版本验证）；Next 示例的 `dist` 模式（`pnpm dev:dist` 和生产构建）；Next 宿主在仓库外未验证 |
| C. 其他框架的源码引入 | Vite、webpack 等 | **未验证**，只有 Next（Turbopack）有配置可参考 |

所有方式共同的前提：

- React 19。编辑器是纯客户端组件，**不能在服务端创建**，Next 里必须 `ssr: false`。
- 渲染编辑器的容器**必须有明确高度**，目前只支持桌面布局。
- 部署时服务器要允许 `application/wasm`；严格 CSP 的宿主要放行 WASM 编译。
- **项目管理（列表、新建、重命名、复制、删除）和页面路由都属于宿主**，编辑器包里没有项目列表组件。编辑器只负责打开一个项目、编辑、自动保存和导出，见下一节。

---

## 项目管理由宿主负责

编辑器只做「打开一个项目并编辑」，**不含**项目列表页和列表级 API。你的应用需要两个页面：

| 页面 | 做什么 | 是否需要编辑器实例 |
| --- | --- | --- |
| 项目列表页 | 用仓库（`createBrowserRepositories`）列出、新建、重命名、复制、删除项目 | **不需要**，不加载 WASM |
| 剪辑页 | 渲染 `<ProjectEditor projectId={id} />` | 由组件在内部创建 |

要点：

- 存储是浏览器的 IndexedDB 加 OPFS（目前只支持这一种）。列表页和剪辑页使用**同一个 `namespace`**，才能看到同一份数据。
- 新建：`const record = await createProjectRecord({ name })`，`await projects.save(record)`，再跳转到 `/editor/${record.metadata.id}`。
- 剪辑页的 `onExit`（用户点菜单里的 Exit project，项目已保存并关闭）里切换回列表。
- 同一页面只能有一个编辑器：不要同时放两个 `ProjectEditor`，也不要与手动 `createEditor` 混用。

完整说明和参考实现（`examples/next/app/`）见 [docs/project-management.md](docs/project-management.md)。

---

## 1. 方式 A1：在本仓库里用源码跑 Next

最快的方式，用来看效果、改编辑器、调主题。

```bash
pnpm install
```
安装整个 pnpm 工作区的依赖。

```bash
cd examples/next
pnpm dev
```
实际执行的是 `BVE_SOURCE=1 next dev --hostname 127.0.0.1 --port 5202`。`BVE_SOURCE=1` 是示例自己的开关：打开后 Next 直接编译 `packages/editor/src`，并启用样式编译流水线。访问 `http://127.0.0.1:5202`，改 `packages/editor/src` 里的代码会热更新，不用先 `pnpm build`。主题验收页是 `http://127.0.0.1:5202/theme`。

对照用：
```bash
pnpm dev:dist
```
同一个应用，改用 `packages/editor/dist`（打包产物）。

注意：

- 改了 `packages/editor/src/theme/tokens.ts` 后，先在仓库根目录运行 `node scripts/generate-theme.mjs`。
- Next 开发服务器偶尔不拾取 CSS 变更，页面样式没更新时重启 `pnpm dev`。
- 不要在 `pnpm dev` 运行时执行 `next build`，会覆盖 `.next`，开发服务器随后返回 500，需要删掉 `.next` 重启。
- `packages/render-wasm/dist` 必须存在（仓库里是现成的）。只有改了 Rust 才需要 `pnpm build:wasm`，见 `docs/wasm.md`。

配置文件在 `examples/next/` 下：`next.config.mjs`、`postcss.config.mjs`、`tsconfig.json`，下一节解释它们各自做什么。其中 `postcss.config.mjs` 在 `BVE_SOURCE=1` 时启用 `packages/editor/css-source-plugin.mjs`（见 2.3）。

---

## 2. 方式 A2：把源码放进你自己的 Next 项目

**目录叫什么都可以，不需要 monorepo，不需要 pnpm。** 下面是在一个普通 npm 单仓库的 Next 16 项目里实测过的做法（`next dev`、`next build`、`next start` 均通过，页面正常渲染，WASM 正常加载）。

### 2.1 复制文件

把路径换成你自己的：

```bash
EDITOR=/path/to/basic-video-editor   # 本仓库
APP=/path/to/your-next-app           # 你的 Next 项目
```

```bash
mkdir -p $APP/vendor/video-editor $APP/vendor/render-wasm
```
建好放源码的目录。名字和位置自定，后面配置里的路径要对应。

```bash
cp -R $EDITOR/packages/editor/src $APP/vendor/video-editor/src
find $APP/vendor/video-editor/src -name __tests__ -type d -prune -exec rm -rf {} +
```
复制编辑器源码，并去掉测试目录（测试依赖 vitest，宿主用不到）。

```bash
cp $EDITOR/packages/editor/css-source-plugin.mjs $EDITOR/packages/editor/css-namespace.mjs $EDITOR/packages/editor/css-prefix.mjs $APP/vendor/video-editor/
```
复制编辑器的样式插件。`css-source-plugin.mjs` 是入口，它依次调用 Tailwind、给选择器加 `.bve-scope` 前缀（`css-prefix.mjs`）、给变量和动画加 `bve-` 前缀并展开 `@layer`（`css-namespace.mjs`），**只处理编辑器自己的样式文件，不碰宿主的其他 CSS**。

```bash
cp -R $EDITOR/packages/render-wasm/dist $APP/vendor/render-wasm/dist
```
复制 WASM 内核的构建产物（`.wasm`、JS 和类型文件）。宿主不需要 Rust 工具链，只用这份现成的产物。

### 2.2 安装依赖

没有 workspace 帮你装，需要自己把编辑器源码用到的依赖写进宿主。版本是写文档时的快照，**以 `packages/editor/package.json` 为准**。

```bash
npm install \
  @base-ui/react@1.7.0 @hugeicons/core-free-icons@3.3.0 @hugeicons/react@1.1.6 \
  class-variance-authority@0.7.1 clsx@2.1.1 culori@4.0.2 eventemitter3@5.0.1 \
  lucide-react@0.562.0 mediabunny@1.29.1 motion@12.18.1 nanoid@5.1.5 \
  react-resizable-panels@2.1.7 react-window@2.2.7 soundtouchjs@0.3.0 \
  tailwind-merge@3.5.0 use-deep-compare-effect@1.8.1 zod@4.3.6 zustand@5.0.2
```
编辑器的运行时依赖。

```bash
npm install \
  @fontsource/inter@5.3.0 tailwindcss@4.2.1 @tailwindcss/typography@0.5.19 \
  tailwindcss-animate@1.0.7 @tailwindcss/postcss@4.2.1 postcss@8.5.6 \
  postcss-prefix-selector@2.1.1
```
样式编译需要的：Tailwind 4 本体、两个插件、PostCSS 和前缀插件，以及 Inter 字体。

```bash
npm install -D @types/culori@4.0.1
```
类型声明。缺它 `next build` 的类型检查会报 `Could not find a declaration file for module 'culori'`。

pnpm 或 yarn 把 `npm install` 换成 `pnpm add` / `yarn add` 即可。**React 和 react-dom 只能有宿主这一份**，不要在 vendor 目录里再装。

### 2.3 三项配置

**`next.config.mjs`：把包名解析到 vendor 里的源码**

```js
const editor = "./vendor/video-editor/src";

export default {
  turbopack: {
    resolveAlias: {
      "@basic-video-editor/editor": `${editor}/index.tsx`,
      "@basic-video-editor/editor/style.css": `${editor}/react/style.css`,
      "@basic-video-editor/render-wasm": "./vendor/render-wasm/dist/index.js",
    },
  },
};
```
前两行让 `import ... from "@basic-video-editor/editor"` 和它的样式落到源码文件；第三行是源码内部对 WASM 内核的引用。Next 16 默认就是 Turbopack；webpack 模式未验证。

**`postcss.config.mjs`：样式流水线**

宿主**没有** Tailwind 时：
```js
import path from "node:path";

export default {
  plugins: {
    [path.resolve(process.cwd(), "vendor/video-editor/css-source-plugin.mjs")]: {},
  },
};
```

宿主**自己也用 Tailwind 4** 时，再加一行 `@tailwindcss/postcss`，放在编辑器插件**后面**：
```js
export default {
  plugins: {
    [path.resolve(process.cwd(), "vendor/video-editor/css-source-plugin.mjs")]: {}, // 只处理编辑器样式
    "@tailwindcss/postcss": {},                                                    // 宿主自己的 Tailwind
  },
};
```
**少了编辑器插件，编辑器样式既不隔离，也没有工具类。**

关于宿主已有 Tailwind，要说清楚：
- **编辑器的样式源文件使用 Tailwind 4 语法**（`@plugin`、`@custom-variant`、`@theme inline`、`@utility`）。宿主是 Tailwind 4 才能走源码方式；**Tailwind 3 的宿主请用方式 B（打包引入）**，打包产物是编译好的 CSS，和宿主有没有 Tailwind、什么版本都无关。
- **不要**把编辑器的三个 PostCSS 插件直接放进宿主的全局配置。它们会改写宿主所有的 CSS：实测宿主的 `.host-title` 会变成 `.bve-scope .host-title`（样式失效），宿主的变量 `--my-brand` 被改名成 `--bve-internal-my-brand`。`css-source-plugin.mjs` 就是为避免这个问题而写的，它只对 `vendor/video-editor/src/react/style.css` 生效。
- 宿主的 Tailwind 和编辑器的 Tailwind 各自编译、互不影响：编辑器的工具类全部限定在 `.bve-scope` 里，变量带 `bve-` 前缀，宿主的类名和主题变量不受影响。已用一个带 `@import "tailwindcss"`、自定义变量和 `bg-red-500` 的宿主验证。

**`tsconfig.json`：必须包含这些**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "paths": {
      "@/*": ["./vendor/video-editor/src/*"],
      "@basic-video-editor/editor": ["./vendor/video-editor/src/index.tsx"],
      "@basic-video-editor/render-wasm": ["./vendor/render-wasm/dist/index.d.ts"]
    }
  }
}
```
（其余选项保持 Next 默认。）

- `@/*`：编辑器源码内部互相用 `@/xxx` 引用，必须配。去掉后页面直接 500，报 `Can't resolve '@/actions/keybindings-store'`。**它对整个宿主生效，宿主自己的代码要用相对路径，不能再用 `@/` 指向自己的目录。**
- 后两条：给 TypeScript 找到包的类型。
- `strict: true` 和 `target: ES2022`：编辑器源码是按这个设置写的，不开的话 `next build` 的类型检查会对 vendor 源码报错。

### 2.4 写页面

`app/editor.tsx`，客户端组件。最小演示：先建一个项目，再用 `ProjectEditor` 打开它（真实应用里项目 id 来自你的项目列表或路由，见「项目管理由宿主负责」）：

```tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserRepositories, createProjectRecord, ProjectEditor } from "@basic-video-editor/editor";
import "@basic-video-editor/editor/style.css";

const NAMESPACE = "my-app";

export default function Editor() {
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { projects } = createBrowserRepositories({ namespace: NAMESPACE });
      const record = await createProjectRecord({ name: "My project" });
      await projects.save(record);
      setProjectId(record.metadata.id);
    })();
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      {projectId && (
        <ProjectEditor
          projectId={projectId}
          storageNamespace={NAMESPACE}
          theme="light"
          onExport={({ blob, filename }) => {
            const url = URL.createObjectURL(blob);
            Object.assign(document.createElement("a"), { href: url, download: filename }).click();
            URL.revokeObjectURL(url);
          }}
        />
      )}
    </div>
  );
}
```

`ProjectEditor` 做了这些：创建编辑器、打开项目、显示加载图标和错误界面、自动保存、卸载时先保存再销毁，并处理 React StrictMode。不需要自己写 `createEditor`、`destroy()` 和会话 hook。

`app/host.tsx`，关闭服务端渲染：

```tsx
"use client";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("./editor"), { ssr: false });
export default function Host() { return <Editor />; }
```

`app/page.tsx`：

```tsx
import Host from "./host";
export default function Page() { return <Host />; }
```

### 2.5 验证

```bash
npm run dev
```
打开页面应看到完整的编辑器（左素材、中预览、右属性、下时间线），浏览器控制台没有报错。再执行 `npm run build && npm start`，生产模式也应能正常渲染。

### 2.6 升级编辑器

没有自动化：在本仓库拉到新代码后，重新执行 2.1 的复制命令覆盖 `vendor/`，对比 `packages/editor/package.json` 的依赖版本是否有变化，然后重启开发服务器。

### 2.7 常见错误

| 现象 | 原因和处理 |
| --- | --- |
| 页面 500，`Can't resolve '@/…'` | `tsconfig.json` 缺 `paths` 里的 `@/*` |
| `next build` 报 `Cannot find module '@basic-video-editor/render-wasm'` 或 `'@basic-video-editor/editor'` | `tsconfig.json` 缺对应的 `paths` |
| `next build` 报 `Could not find a declaration file for module 'culori'` | 没装 `@types/culori` |
| `next build` 在 vendor 源码里报一堆类型错误 | `tsconfig.json` 没有 `strict: true` 或 `target: ES2022` |
| 宿主自己的 CSS 突然失效、类名前多了 `.bve-scope`，或自定义变量被改名 | 把编辑器的 PostCSS 插件放进了全局配置；改用 `css-source-plugin.mjs`（2.3） |
| 页面空白，报 `window is not defined` | 没用 `dynamic(..., { ssr: false })` |
| 编辑器没有高度 | 外层容器没设高度 |
| 编辑器样式不对、没有工具类 | `postcss.config.mjs` 没生效，检查 `css-source-plugin.mjs` 的路径；改配置后要重启开发服务器 |
| 行为怪异、hooks 报错 | React 装了两份，检查 vendor 里没有自己的 `node_modules` |

---

## 3. 方式 B：打包引入

宿主不需要 Tailwind、别名和 PostCSS 配置，只装一个包。

### 3.1 在本仓库里打包

```bash
pnpm install
```
装依赖。

```bash
pnpm build:wasm
```
**只有改过 Rust 才需要。** 重建 `packages/render-wasm/dist`。

```bash
pnpm build
```
等价于 `pnpm --filter @basic-video-editor/editor build`，依次做四件事：生成主题 CSS（`generate-theme.mjs`）→ `vite build` 产出 `dist/index.js`、`dist/style.css`、`dist/assets/*.wasm` → `tsc` 生成类型声明 → `fix-declaration-paths.mjs` 把声明里的 `@/` 改成相对路径，并把 `render-wasm` 的类型文件复制进 `dist/types/render-wasm/`。

```bash
pnpm audit:package
```
检查产物：所有 CSS 选择器都在 `.bve-scope` 下、没有残留 `@layer`、没有直接挂到 `document.body` 的浮层、WASM 和类型都在。要看到 `"passed": true`。

```bash
pnpm --filter @basic-video-editor/editor pack --pack-destination ./release
```
把 `dist` 和 `LICENSE` 打成 `./release/basic-video-editor-editor-0.1.0.tgz`（约 2.2MB）。**包是 `private` 的**，交给宿主的方式是拷贝这个文件，或放进团队的私有制品库，不能发到公共 npm。

`render-wasm` 是构建期内部包，已被打进 editor 的 `dist`，**宿主不需要单独装它**。

### 3.2 在宿主里使用

```bash
npm install /绝对路径/release/basic-video-editor-editor-0.1.0.tgz react@19 react-dom@19
```
装编辑器和它的依赖，并保证宿主有 React 19。pnpm / yarn 同理。

`tsconfig.json` 加 `"skipLibCheck": true`。原因：依赖里的类型声明与 TypeScript 5.8 自带的 DOM 声明有重复。

代码和 2.4 完全一样（`"@basic-video-editor/editor"` 的 import 不变）。Vite + React 宿主直接用；Next 宿主同样需要 `"use client"` 和 `dynamic(..., { ssr: false })`。

```bash
npm run dev
```
```bash
npm run build
```
开发和生产构建。部署时保留整个输出目录。

### 3.3 更新

改了编辑器后，**先把 `packages/editor/package.json` 的 `version` 加一**（例如 0.1.1），再重新 `pnpm build` 和 `pack`，宿主重新安装新的 tgz，然后重启开发服务器。版本不变时包管理器可能继续用缓存里的旧包。

---

## 4. 最小用法

```tsx
"use client";
import { ProjectEditor } from "@basic-video-editor/editor";
import "@basic-video-editor/editor/style.css";

<div style={{ height: "100vh" }}>           {/* 容器必须有明确高度 */}
  <ProjectEditor
    projectId={id}
    storageNamespace="my-app"               {/* 列表页使用相同的值 */}
    onExit={() => router.push("/")}
    onExport={({ blob, filename }) => { /* 由宿主下载或上传 */ }}
  />
</div>
```

全部属性、事件、生命周期规则、存储接口、字体和转录提供方见 [docs/api.md](docs/api.md)。需要自己管理编辑器实例时用 `createEditor` + `<VideoEditor>`，同样在 api.md。

## 5. 主题定制

`theme`、`density`、`appearance` 三个入参，改了即时生效，不会重建编辑器，也不写进工程文件：

```tsx
<ProjectEditor
  projectId={id}
  theme="light"
  density="compact"
  appearance={{
    base:  { "radius-control": "8px" },                             // 明暗都生效
    light: { primary: "#d9480f", "primary-foreground": "#fff" },
    dark:  { primary: "#ff8a5c" },
  }}
/>
```

- `primary` 是品牌色；`cue` 是编辑提示色（播放头、吸附线、选中框），两者独立，换品牌色不会改变提示线。
- 键是 token 名（去掉 `--bve-` 前缀），值是任意 CSS 值，也可以是宿主的变量，如 `"var(--my-brand)"`。
- 完整规则见 [docs/theme.md](docs/theme.md)，全部 token 见 [docs/theme-tokens.md](docs/theme-tokens.md)。先看效果：方式 A1 启动后打开 `http://127.0.0.1:5202/theme`。

## 6. 样式隔离

- 编辑器所有选择器都在 `.bve-scope` 下，变量带 `--bve-` 前缀，动画带 `bve-` 前缀；不会修改宿主的 `:root`、`body` 或全局元素样式。
- `@layer` 在构建时被展开，宿主的全局样式（例如 `button { ... }`）不会覆盖编辑器；已用带激进全局样式的宿主验证。
- 防不住：宿主的 `!important`，以及直接针对 `.bve-scope` 内部类名的覆盖。
