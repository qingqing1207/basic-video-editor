# 来源与许可

来源：[OpenCut](https://github.com/OpenCut-app/OpenCut)，固定提交 `cf5e79e919144200294fb9fed22a222592a0aeea`。原始仓库作为只读参照放在本地的 `opencut/`（不随本仓库提交；构建和运行不依赖它），抽离后的 JavaScript/TypeScript、Rust 和相关资源遵守其 MIT 许可；许可文本位于两个包的 LICENSE 中。

Inter 来自 @fontsource/inter 5.3.0，SIL Open Font License 1.1；文本保留在 editor/src/assets/INTER-LICENSE.txt。打包时同时复制许可文件。其余依赖及锁定版本见包 manifests/pnpm-lock.yaml；第三方代码的原作者注释保留。

本项目没有向公共包仓库发布。保留 OpenCut 来源说明不意味着 OpenCut 为修改后的包提供支持。

Next 示例的项目列表页（`examples/next/app/`）参照同一提交下 `apps/web/src/app/projects/page.tsx` 的功能与交互，用宿主自己的样式重写，不复制原仓库的组件代码；原页面适用上述 OpenCut MIT 许可。
