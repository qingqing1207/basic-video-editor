import { EditorCore } from "@/core";
/** Commands emit notifications; only the React binding depends on a toast UI. */
export const toast = {
  error(title: string, options?: { description?: string }) {
    return EditorCore.getActiveInstance()?.notifications.emit({
      type: "error",
      title,
      ...options,
    });
  },
  promise<T>(
    run: () => Promise<T>,
    options: {
      loading: string;
      success: string | ((result: T) => string);
      error: string;
    },
  ) {
    const bus = EditorCore.getInstance().notifications;
    const id = bus.emit({ type: "loading", title: options.loading });
    const task = run().then(
      (result) => {
        bus.emit({
          id,
          type: "success",
          title:
            typeof options.success === "string"
              ? options.success
              : options.success(result),
        });
        return result;
      },
      (error) => {
        bus.emit({ id, type: "error", title: options.error });
        throw error;
      },
    );
    return { unwrap: () => task };
  },
};
