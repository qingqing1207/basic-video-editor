import { useEffect, useState } from "react";
import { Toast } from "@base-ui/react/toast";
import type { EditorCore } from "@/core";
import { useEditorUI } from "./ui-context";
export function EditorNotifications({
  editor,
  children,
}: {
  editor: EditorCore;
  children: React.ReactNode;
}) {
  const [manager] = useState(() => Toast.createToastManager());
  useEffect(
    () =>
      editor.notifications.subscribe((event) => {
        manager.add({ ...event, timeout: event.type === "loading" ? 0 : 5000 });
      }),
    [editor, manager],
  );
  return (
    <Toast.Provider toastManager={manager}>
      <ToastList />
      {children}
    </Toast.Provider>
  );
}
function ToastList() {
  const { toasts } = Toast.useToastManager();
  const { portalContainer } = useEditorUI();
  return (
    <Toast.Portal container={portalContainer}>
      <Toast.Viewport className="fixed right-4 bottom-4 bve-overlay-layer flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="bve-overlay bve-panel-spacing"
          >
            <Toast.Content>
              <Toast.Title className="text-sm font-medium" />
              <Toast.Description className="text-xs text-muted-foreground" />
              <Toast.Close
                className="absolute right-2 top-1"
                aria-label="Dismiss notification"
              >
                ×
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
