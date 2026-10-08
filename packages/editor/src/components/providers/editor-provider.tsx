"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { EditorCore } from "@/core";
import { useEditor } from "@/editor/use-editor";
import { useKeybindingsListener } from "@/actions/use-keybindings";
import { useKeybindingsStore } from "@/actions/keybindings-store";
import { useTimelineStore } from "@/timeline/timeline-store";
import { useEditorActions } from "@/actions/use-editor-actions";

export function EditorRuntimeBindings() {
  const editor = useEditor();
  const rippleEditingEnabled = useTimelineStore(
    (state) => state.rippleEditingEnabled,
  );

  useEffect(() => {
    editor.command.isRippleEnabled = rippleEditingEnabled;
  }, [editor, rippleEditingEnabled]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editor.save.getIsDirty()) return;
      event.preventDefault();
      (event as unknown as { returnValue: string }).returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editor]);

  useEditorActions();
  useKeybindingsListener();
  return null;
}
