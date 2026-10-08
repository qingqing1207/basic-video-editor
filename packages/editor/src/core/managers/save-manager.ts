import type { EditorCore } from "@/core";

export type SaveEvent =
  | { type: "dirty"; dirty: boolean }
  | { type: "saved"; projectId: string }
  | { type: "error"; error: Error };
export class SaveManager {
  private paused = false;
  private dirty = false;
  private revision = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<void> | null = null;
  private unsubscribers: Array<() => void> = [];
  private listeners = new Set<(event: SaveEvent) => void>();
  private editor: EditorCore;
  private debounceMs: number;
  constructor({
    editor,
    debounceMs = 800,
  }: {
    editor: EditorCore;
    debounceMs?: number;
  }) {
    this.editor = editor;
    this.debounceMs = debounceMs;
  }
  /** Autosave status for hosts: dirty state changes, completed saves and failures. */
  subscribe(listener: (event: SaveEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private emit(event: SaveEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(error);
      }
    }
  }
  private setDirty(dirty: boolean) {
    if (this.dirty === dirty) return;
    this.dirty = dirty;
    this.emit({ type: "dirty", dirty });
  }

  start() {
    if (this.unsubscribers.length) return;
    this.unsubscribers = [
      this.editor.document.subscribe(() => this.markDirty()),
      this.editor.timeline.subscribe(() => this.markDirty()),
    ];
  }
  stop() {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    this.clearTimer();
  }
  pause() {
    this.paused = true;
    this.clearTimer();
  }
  resume() {
    this.paused = false;
    if (this.dirty) this.queueSave();
  }
  markDirty({ force = false }: { force?: boolean } = {}) {
    if (this.paused && !force) return;
    this.setDirty(true);
    this.revision++;
    this.queueSave();
  }
  getIsDirty() {
    return this.dirty || this.inFlight !== null;
  }
  reset() {
    if (this.inFlight) throw new Error("Cannot reset while saving");
    this.clearTimer();
    this.setDirty(false);
  }
  async settle() {
    this.clearTimer();
    await this.inFlight?.catch(() => {});
  }
  async flush() {
    this.clearTimer();
    if (this.inFlight) await this.inFlight;
    while (this.dirty && this.editor.project.getActiveOrNull())
      await this.saveNow();
  }
  private queueSave() {
    if (this.paused || this.inFlight) return;
    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.saveNow().catch(() => {});
    }, this.debounceMs);
  }
  private saveNow(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    const active = this.editor.project.getActiveOrNull();
    if (!this.dirty || !active) return Promise.resolve();
    const revision = this.revision;
    const projectId = active.metadata.id;
    this.clearTimer();
    this.inFlight = this.editor.project
      .saveCurrentProject()
      .then(
        () => {
          this.emit({ type: "saved", projectId });
          this.setDirty(this.revision !== revision);
        },
        (error) => {
          this.setDirty(true);
          this.emit({
            type: "error",
            error: error instanceof Error ? error : new Error(String(error)),
          });
          this.editor.notifications.emit({
            type: "error",
            title: "Project was not saved",
            description: error instanceof Error ? error.message : String(error),
          });
          throw error;
        },
      )
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight.then(() => {
      if (this.dirty && !this.paused) this.queueSave();
    });
  }
  private clearTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
