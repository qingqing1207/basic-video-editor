import path from "node:path";

// BVE_SOURCE=1：编辑器的样式由宿主构建编译，css-source-plugin 只处理编辑器自己的 style.css。
// 宿主自己的页面样式始终由 @tailwindcss/postcss 处理。dist 模式下编辑器的 CSS 已是成品。
export default {
  plugins: {
    ...(process.env.BVE_SOURCE === "1" && {
      [path.resolve(process.cwd(), "../../packages/editor/css-source-plugin.mjs")]: {},
    }),
    "@tailwindcss/postcss": {},
  },
};
