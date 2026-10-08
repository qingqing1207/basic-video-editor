import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SaveManager, type SaveEvent } from "../save-manager";
import type { EditorCore } from "@/core";

function fixture() {
  const save = vi.fn(async () => {});
  const notifications = { emit: vi.fn() };
  const editor = {
    document: { subscribe: () => () => {} },
    timeline: { subscribe: () => () => {} },
    project: {
      getActiveOrNull: () => ({ metadata: { id: "p1" } }),
      saveCurrentProject: save,
    },
    notifications,
  };
  const manager = new SaveManager({ editor: editor as unknown as EditorCore });
  const events: SaveEvent[] = [];
  manager.subscribe((event) => events.push(event));
  return { manager, events, save, notifications };
}

describe("autosave status events", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports dirty, then saved, then clean after the debounced save", async () => {
    const { manager, events, save } = fixture();
    manager.markDirty();
    manager.markDirty();
    expect(events).toEqual([{ type: "dirty", dirty: true }]);
    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenCalledOnce();
    expect(events).toEqual([
      { type: "dirty", dirty: true },
      { type: "saved", projectId: "p1" },
      { type: "dirty", dirty: false },
    ]);
  });

  it("stays dirty when edits arrive while a save is in flight", async () => {
    const { manager, events, save } = fixture();
    let release!: () => void;
    save.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)));
    manager.markDirty();
    await vi.advanceTimersByTimeAsync(800);
    manager.markDirty();
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(events.filter((e) => e.type === "dirty").map((e) => (e as { dirty: boolean }).dirty)).toEqual([true]);
    expect(manager.getIsDirty()).toBe(true);
  });

  it("reports a failed save as an error and keeps the project dirty", async () => {
    const { manager, events, save, notifications } = fixture();
    save.mockRejectedValueOnce(new Error("Quota exceeded"));
    manager.markDirty();
    await vi.advanceTimersByTimeAsync(800);
    expect(events.at(-1)).toMatchObject({ type: "error", error: expect.objectContaining({ message: "Quota exceeded" }) });
    expect(events.some((e) => e.type === "saved")).toBe(false);
    expect(manager.getIsDirty()).toBe(true);
    expect(notifications.emit).toHaveBeenCalledOnce();
  });

  it("stops notifying after unsubscribe", () => {
    const { manager } = fixture();
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);
    unsubscribe();
    manager.markDirty();
    expect(listener).not.toHaveBeenCalled();
  });
});
