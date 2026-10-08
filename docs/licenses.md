# 来源与许可

来源：[OpenCut](https://github.com/OpenCut-app/OpenCut)，固定提交 `cf5e79e919144200294fb9fed22a222592a0aeea`。原始仓库完整保留在 `opencut/`，抽离后的 JavaScript/TypeScript、Rust 和相关资源遵守其 MIT 许可；许可文本位于两个包的 LICENSE 中。

Inter 来自 @fontsource/inter 5.3.0，SIL Open Font License 1.1；文本保留在 editor/src/assets/INTER-LICENSE.txt。打包时同时复制许可文件。验收素材 `docs/fixtures/host-font.woff2` 同样是此 Inter 字体，适用同一许可。其余依赖及锁定版本见包 manifests/pnpm-lock.yaml；第三方代码的原作者注释保留。

本项目没有向公共包仓库发布。保留 OpenCut 来源说明不意味着 OpenCut 为修改后的包提供支持。

项目管理页复用同一提交下 apps/web/src/app/projects/page.tsx、store.ts 和项目弹窗／卡片样式；适用上述 OpenCut MIT 许可，新增宿主路由不引用原仓库。
