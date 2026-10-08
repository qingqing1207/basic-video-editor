# WASM 重建

精简源码位于 `packages/render-wasm/rust`。Rust 时间 tick、帧率、时间线计算、蒙版、GPU 合成保留；公开 Effects 注册机制及全部通用特效模块移除。背景模糊与蒙版羽化只使用渲染内部的 Gaussian blur pass，不能从编辑器添加特效轨道。

锁定版本：Rust 1.98.1（rust-toolchain.toml）、wasm-bindgen-cli 0.2.116；Cargo.lock 固定依赖。构建不读取 opencut/。

```sh
rustup toolchain install 1.98.1 --profile minimal
rustup target add wasm32-unknown-unknown --toolchain 1.98.1
cargo +1.98.1 install wasm-bindgen-cli --version 0.2.116 --locked
pnpm build:wasm
pnpm build
```

当前工作区也有 `.tools/cargo` 和 `.tools/rustup` 的本地工具链。构建脚本在未显式指定 CARGO_HOME 且本地工具链存在时使用它，否则使用 PATH 中的 cargo/wasm-bindgen。不会要求消费者安装这些工具。

WASM 生成物放入 render-wasm/dist；编辑器构建将二进制复制到自己的 dist/assets 并使用相对 import.meta.url 定位。部署需要允许 application/wasm，浏览器必须允许 WASM 编译；严格 CSP 宿主需配置相应策略。

宿主只安装 editor 包：render-wasm 是构建期内部包（editor 的 devDependency），其类型声明在 `pnpm build` 时复制进 `editor/dist/types/render-wasm/`，WASM 二进制复制进 `editor/dist/assets/`。
