import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
const workspace=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({plugins:[{name:'baseline-test-runner',transform(code,id){if(id.includes('/__tests__/'))return code.replaceAll('"bun:test"','"vitest"');}}],resolve:{alias:{'@':workspace+'opencut/apps/web/src','opencut-wasm':workspace+'packages/render-wasm/dist/index.js'}},test:{include:['opencut/apps/web/src/masks/__tests__/snap.test.ts','opencut/apps/web/src/timeline/placement/__tests__/resolve.test.ts'],setupFiles:[workspace+'tests/wasm-setup.ts']}});
