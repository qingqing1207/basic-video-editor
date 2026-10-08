import init from "./opencut_wasm.js";
export * from "./opencut_wasm.js";
let ready;
export function initializeWasm(){return ready??=init({module_or_path:new URL("./opencut_wasm_bg.wasm",import.meta.url).href});}
