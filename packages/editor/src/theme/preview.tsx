"use client";
import "../react/style.css";
import { lazy, Suspense, useEffect, useState } from "react";
import type { EditorThemePreviewProps } from "./preview-view";
export type { EditorThemePreviewProps } from "./preview-view";
const Preview = lazy(async () => {
  const { initializeWasm } = await import("@basic-video-editor/render-wasm");
  await initializeWasm();
  const view = await import("./preview-view");
  return { default: view.EditorThemePreview };
});
export function EditorThemePreview(props: EditorThemePreviewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? (
    <Suspense fallback={<div>Loading appearance samples…</div>}>
      <Preview {...props} />
    </Suspense>
  ) : (
    <div data-theme-preview-placeholder="" />
  );
}
