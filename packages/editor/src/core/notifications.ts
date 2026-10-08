export interface EditorNotification {
  id: string;
  type: "error" | "success" | "loading" | "info";
  title: string;
  description?: string;
}
export class Notifications {
  private listeners = new Set<(event: EditorNotification) => void>();
  subscribe(listener: (event: EditorNotification) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  emit(event: Omit<EditorNotification, "id"> & { id?: string }) {
    const notification = { ...event, id: event.id ?? crypto.randomUUID() };
    for (const listener of this.listeners) listener(notification);
    return notification.id;
  }
  clear() {
    this.listeners.clear();
  }
}
