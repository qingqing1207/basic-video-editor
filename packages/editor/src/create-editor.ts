import type { EditorCore } from "./core";
import type { EditorOptions } from "./api/adapters";

let creating = false;
export async function createEditor(
  options: EditorOptions = {},
): Promise<EditorCore> {
  if (typeof window === "undefined")
    throw new Error("createEditor must run in a browser");
  if (creating) throw new Error("Another editor is being created");
  creating = true;
  try {
    const { initializeWasm } = await import("@basic-video-editor/render-wasm");
    await initializeWasm();
    const [{ EditorCore }, { initializeGpuRenderer, isGpuAvailable }] =
      await Promise.all([
        import("./core"),
        import("./services/renderer/gpu-renderer"),
      ]);
    const editor = EditorCore.create(options);
    try {
      const { initializePreferences } = await import("./browser/preferences");
      await initializePreferences(options.storageNamespace);
      await initializeGpuRenderer();
      editor.renderer.setDegraded(!isGpuAvailable());
      await editor.fonts.load("Inter");
      return editor;
    } catch (error) {
      await editor.destroy({ discard: true });
      throw error;
    }
  } finally {
    creating = false;
  }
}
