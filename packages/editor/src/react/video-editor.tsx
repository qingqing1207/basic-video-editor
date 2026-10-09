"use client";
import { ResolvedThemeContext, useEditorTheme } from "@/theme/use-editor-theme";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { VideoEditorProps } from "@/index";
import { EditorUIContext } from "./ui-context";
import { EditorLayout, DegradedRendererBanner } from "./editor-layout";
import { EditorHeader } from "@/components/editor/editor-header";
import { EditorRuntimeBindings } from "@/components/providers/editor-provider";
import { EditorNotifications } from "./notifications";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEditor } from "@/editor/use-editor";
import { ImportTrimDialog } from "@/components/editor/import-trim-dialog";
import { useImportTrimStore } from "@/media/import-trim";
export default function VideoEditorView({
  editor,
  theme: controlledTheme,
  defaultTheme = "dark",
  onThemeChange,
  portalContainer,
  appearance,
  density = "compact",
  trimOnImport = true,
  className,
  style,
  topBar,
  onExport,
  onExit,
}: VideoEditorProps) {
  const [theme, setTheme] = useState(defaultTheme);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const currentTheme = controlledTheme ?? theme;
  const { themeStyle, snapshot } = useEditorTheme({
    root,
    portal,
    theme: currentTheme,
    appearance,
    density,
    style,
  });
  useEffect(() => {
    if (!root) return;
    const release = editor.attachView(root);
    return () => {
      release();
      editor.playback.pause();
      editor.project.cancelExport();
      editor.transcription.cancel();
    };
  }, [editor, root]);
  useEffect(() => {
    useImportTrimStore.setState({ enabled: trimOnImport });
  }, [trimOnImport]);
  useEffect(() => {
    if (!portal) return;
    editor.activeRoots.add(portal);
    return () => {
      editor.activeRoots.delete(portal);
    };
  }, [editor, portal]);
  const portalElement = (
    <div
      ref={setPortal}
      className={`bve-scope ${currentTheme}`}
      data-density={density}
      data-editor-portals=""
    />
  );
  return (
    <ResolvedThemeContext.Provider value={snapshot}>
      <EditorUIContext.Provider
        value={{
          appearance,
          density,
          portalContainer: portal,
          theme: currentTheme,
          setTheme: (next) => {
            setTheme(next);
            onThemeChange?.(next);
          },
          onExport,
          onExit,
        }}
      >
        <div
          ref={setRoot}
          tabIndex={-1}
          data-video-editor=""
          data-density={density}
          className={`bve-scope ${currentTheme} ${className ?? ""}`}
          style={{
            height: "100%",
            width: "100%",
            minHeight: 0,
            minWidth: 0,
            outline: "none",
            ...themeStyle,
            ...style,
          }}
          onPointerDownCapture={(event) => {
            if (
              event.target === event.currentTarget ||
              !(event.target as HTMLElement).closest(
                "button,input,textarea,select,[tabindex],[contenteditable]",
              )
            )
              root?.focus({ preventScroll: true });
          }}
        >
          <TooltipProvider delayDuration={300}>
            <EditorNotifications editor={editor}>
              <EditorContent topBar={topBar} />
              <ImportTrimDialog />
            </EditorNotifications>
          </TooltipProvider>
          {!portalContainer && portalElement}
        </div>
        {portalContainer && createPortal(portalElement, portalContainer)}
      </EditorUIContext.Provider>
    </ResolvedThemeContext.Provider>
  );
}
function EditorContent({ topBar }: { topBar?: React.ReactNode }) {
  const project = useEditor((editor) => editor.project.getActiveOrNull());
  if (!project)
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Open or create a project to start editing.
      </div>
    );
  return (
    <div className="bg-canvas text-foreground flex size-full flex-col overflow-hidden">
      <EditorRuntimeBindings />
      <DegradedRendererBanner />
      <EditorHeader />
      {topBar}
      <div className="min-h-0 min-w-0 flex-1">
        <EditorLayout />
      </div>
    </div>
  );
}
