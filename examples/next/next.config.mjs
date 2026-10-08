import path from "node:path";
import { fileURLToPath } from "node:url";

// BVE_SOURCE=1 编译 packages/editor/src；否则使用 packages/editor/dist。
const source = process.env.BVE_SOURCE === "1";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const editor = "../../packages/editor/src";

export default {
  agentRules: false,
  ...(source && {
    turbopack: {
      root,
      resolveAlias: {
        "@basic-video-editor/editor": `${editor}/index.tsx`,
        "@basic-video-editor/editor/style.css": `${editor}/react/style.css`,
        "@basic-video-editor/editor/theme-preview": `${editor}/theme/preview.tsx`,
      },
    },
  }),
};
