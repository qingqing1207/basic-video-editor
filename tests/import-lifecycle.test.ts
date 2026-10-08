import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  editor: {
    destroyed: false,
    mediaGeneration: 0,
    trackTask: vi.fn(<T>(task: Promise<T>) => task),
  },
}));
vi.mock("@/core", () => ({ EditorCore: { getInstance: () => state.editor } }));
vi.mock("@/core/notify", () => ({
  toast: {
    promise: (run: () => Promise<unknown>) => {
      const task = run();
      return { unwrap: () => task };
    },
  },
}));
import { showMediaUploadToast } from "@/media/upload-toast";

describe("import lifecycle boundary", () => {
  let frames: FrameRequestCallback[];
  beforeEach(() => {
    frames = [];
    state.editor.destroyed = false;
    state.editor.mediaGeneration = 0;
    state.editor.trackTask.mockClear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
  });
  afterEach(() => vi.unstubAllGlobals());
  const paint = () => {
    for (let frame = 0; frame < 2; frame++)
      frames.splice(0).forEach((fn) => fn(frame));
  };

  it("cancels an import if project switching starts before the upload callback runs", async () => {
    const insert = vi.fn(async () => ({ uploadedCount: 1 }));
    const task = showMediaUploadToast({ filesCount: 1, promise: insert });
    const rejected = expect(task).rejects.toMatchObject({ name: "AbortError" });
    expect(state.editor.trackTask).toHaveBeenCalledOnce();
    state.editor.mediaGeneration++;
    paint();
    await rejected;
    expect(insert).not.toHaveBeenCalled();
  });

  it("tracks the whole insertion until storage has settled", async () => {
    let resolve!: (value: { uploadedCount: number }) => void;
    const stored = new Promise<{ uploadedCount: number }>((done) => {
      resolve = done;
    });
    const task = showMediaUploadToast({ filesCount: 1, promise: () => stored });
    const tracked = state.editor.trackTask.mock.calls[0][0];
    let settled = false;
    void tracked.then(() => {
      settled = true;
    });
    paint();
    await Promise.resolve();
    expect(settled).toBe(false);
    resolve({ uploadedCount: 1 });
    await expect(task).resolves.toEqual({ uploadedCount: 1 });
    expect(settled).toBe(true);
  });
});
