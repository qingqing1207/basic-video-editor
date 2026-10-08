import { createContext, useContext } from "react";
export interface EditorUIContextValue {
  onExit?: () => void | Promise<void>;
  onExport?: (result: { blob: Blob; filename: string }) => void | Promise<void>;
  portalContainer: HTMLElement | null;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}
export const EditorUIContext = createContext<EditorUIContextValue>({
  portalContainer: null,
  theme: "dark",
  setTheme: () => {},
});
export const useEditorUI = () => useContext(EditorUIContext);
