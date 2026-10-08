# 状态与已知限制

来源：OpenCut `cf5e79e919144200294fb9fed22a222592a0aeea`。整体仍在验收阶段，**未认定完整抽离完成**。构建成功不等于交互已经验收：源码存在、构建通过、交互通过需要分别判断。

## 已完成

- [x] 独立 pnpm 工作区；编辑器的 ESM、类型、CSS、WASM 产物；原仓库保留在 `opencut/`，源文件未修改。
- [x] 删除指定的服务与特性，精简 Rust 并重建 WASM（见 [wasm.md](wasm.md)）。
- [x] Base UI 组件迁移，删除 Radix / Sonner 直接依赖。
- [x] 存储、字体、转录接口和默认本地适配器（见 [api.md](api.md)）。
- [x] 原版与抽离版四组真实 MP4 的逐帧对照、音频对照、离线 WebM。
- [x] Chromium 与 Safari 各 20 次真实媒体生命周期，以及失败、取消检查。
- [x] 波纹删除、预览缩放平移、面板尺寸、颜色渐变、图片剪贴板粘贴对照。
- [x] 素材面板原生拖放故障修复；宿主 dialog 内的真实鼠标拖入；混合工程导出与刷新恢复。
- [x] 依赖、构建引用和 CSS 隔离审计（`pnpm audit:package`）；自动化测试和类型检查。
- [x] 项目管理移到宿主（Next 示例的 `/` 列表页和 `/editor/[id]` 剪辑页），高层组件 `ProjectEditor`（见 [project-management.md](project-management.md)）。
- [x] 主题系统与 token 收敛，主题验收页（见 [theme.md](theme.md)）。

## 未完成

- [ ] 系统文件的原生拖放、真实操作系统输入法，以及未覆盖的复杂交互组合。
- [ ] Firefox 的能力和可用功能。
- [ ] 用真实视频素材复制项目的端到端验证（素材拷贝和失败回滚目前只有单元测试）。

## 各引入方式的验证状态

用当前代码重新验证过的才标为已验证。操作步骤见 [INTEGRATION.md](../INTEGRATION.md)。

| 引入方式 | 状态 |
| --- | --- |
| Next 源码引入，本仓库内（`pnpm dev`、`pnpm dev:dist`、生产构建） | 已验证：列表、新建、编辑、自动保存、退出、切换项目、不存在的项目 |
| Next 源码引入，普通 npm 单仓库、宿主自己也用 Tailwind 4（`build` + `start`） | 已验证：宿主样式不被改写，编辑器样式和 WASM 正常 |
| 打包引入，Vite + React 19（pnpm） | 已验证：安装、`tsc`、构建、运行、`ProjectEditor` 保存事件、全局样式隔离、主题覆盖、明暗切换 |
| 打包引入，npm | 较早的版本验证过（安装、`tsc`、构建）；加入 `ProjectEditor` 后未重跑 |
| 打包引入，Next 宿主在仓库外 | 未验证（仓库内 `pnpm dev:dist` 和生产构建已验证） |
| 源码引入，宿主用 Tailwind 3 | 不支持，请用打包引入 |
| Vite、webpack 的源码引入 | 未验证 |
| npm / yarn workspaces 的宿主 | 未验证 |
| 其他存储（自己的后端） | 不支持，目前只有浏览器 IndexedDB + OPFS |

## 已知设计限制

- **列表读取很重**：`ProjectStore.list()` 返回所有项目的完整记录。记录里的缩略图是整帧 PNG 的 data URL，约占单条记录体积的 97%（时间线只有 1 到 2 KB）。自动保存每次也会整份重写它。较低风险的改法是把缩略图缩小到 480×270 的 JPEG/WebP，更彻底的做法是把缩略图和元数据拆成独立的存储。
- **保存是整份覆盖**：没有版本号或冲突检测，两个标签页同时编辑同一个项目会互相覆盖。
- **数据只在本机浏览器里**：换设备或清除站点数据会丢失；没有导入导出工程的功能。
- **素材按项目分库**：每个项目一个 IndexedDB 库和一个 OPFS 目录；复制项目要真的拷贝全部素材字节。
- **只能有一个活动编辑器实例**（全局单例），同一页面不能放两个编辑器。
- **只支持桌面布局**；非 Chromium 浏览器按运行时编解码和 GPU 能力降级。

## 历史记录去向

早期的交互验收基线、各项修复的实测记录、`docs/evidence/` 的截图、日志和对照视频、`docs/fixtures/` 的测试素材，已经从仓库删除，保留在首次提交 `5dcc3e5` 的 git 历史里：

```sh
git show 5dcc3e5:docs/interaction-baseline.md     # 查看某份记录
git checkout 5dcc3e5 -- docs/evidence              # 取回整个目录
```

相对 OpenCut 的改动、用户需求溯源和各项修复的结论见 [opencut-changes/README.md](opencut-changes/README.md)。
