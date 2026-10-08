import tailwind from "@tailwindcss/postcss";
import prefix from "postcss-prefix-selector";
import namespace from "./css-namespace.mjs";
import { prefixOptions } from "./css-prefix.mjs";
export default {
  plugins: [tailwind(), prefix(prefixOptions), namespace()],
};
