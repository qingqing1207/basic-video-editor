import { useState, useEffect, useCallback } from "react";
import { useEditor } from "@/editor/use-editor";
export function useFontCatalog({ open }: { open: boolean }) {
  const editor = useEditor();
  const [fontNames, setFontNames] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const retry = useCallback(() => {
    setStatus("loading");
    return editor.fonts.list().then(
      (fonts) => {
        setFontNames([...new Set(fonts.map((f) => f.value))].sort());
        setStatus("idle");
      },
      () => setStatus("error"),
    );
  }, [editor]);
  useEffect(() => {
    if (open) void retry();
  }, [open, retry]);
  return { status, fontNames, retry };
}
