import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorCore } from "@/core";
import type { TProject } from "@/project/types";
import type { AssetRepository, ProjectRepository } from "@/api/adapters";
import type { SerializedProject } from "@/services/storage/types";
import { buildDefaultTimeline } from "@/timeline/document";
import { StorageService } from "@/services/storage/service";
import { TimelineDocumentManager } from "@/core/managers/timeline-document-manager";
import { SaveManager } from "@/core/managers/save-manager";
import {
  ToggleBookmarkCommand,
  UpdateBookmarkCommand,
  MoveBookmarkCommand,
  RemoveBookmarkCommand,
} from "@/commands/bookmark";
import { mediaTime } from "@/wasm";

const state = vi.hoisted(() => ({ editor: null as unknown }));
vi.mock("@/core", () => ({ EditorCore: { getInstance: () => state.editor } }));

function project(): TProject {
  return {
    version: 2,
    metadata: {
      id: "project",
      name: "Timeline",
      duration: mediaTime({ ticks: 0 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    settings: {
      fps: { numerator: 30, denominator: 1 },
      canvasSize: { width: 640, height: 360 },
      background: { type: "color", color: "#000000" },
    },
    timeline: buildDefaultTimeline(),
    timelineViewState: {
      zoomLevel: 0.5,
      scrollLeft: 24,
      playheadTime: mediaTime({ ticks: 120000 }),
    },
  };
}

describe("single project timeline", () => {
  let active: TProject;
  let document: TimelineDocumentManager;
  beforeEach(() => {
    active = project();
    const editor = {
      project: {
        getActive: () => active,
        getActiveOrNull: () => active,
        setActiveProject: ({ project }: { project: TProject }) => {
          active = project;
        },
      },
    } as unknown as EditorCore;
    document = new TimelineDocumentManager(editor);
    Object.assign(editor, { document });
    state.editor = editor;
    document.initialize(active.timeline);
  });

  it("keeps bookmark edits undoable without replacing tracks", () => {
    const at = mediaTime({ ticks: 120000 });
    const to = mediaTime({ ticks: 240000 });
    const tracks = document.getTimeline().tracks;
    const toggle = new ToggleBookmarkCommand(at);
    toggle.execute();
    expect(active.timeline.bookmarks).toEqual([{ time: at }]);
    toggle.undo();
    expect(document.getTimeline().bookmarks).toEqual([]);
    toggle.redo();
    const edit = new UpdateBookmarkCommand({
      time: at,
      updates: { note: "Keep this", color: "#ff0000" },
    });
    edit.execute();
    const move = new MoveBookmarkCommand({ fromTime: at, toTime: to });
    move.execute();
    expect(document.getTimeline().bookmarks[0]).toMatchObject({
      time: to,
      note: "Keep this",
    });
    move.undo();
    edit.undo();
    expect(active.timeline.bookmarks).toEqual([{ time: at }]);
    const remove = new RemoveBookmarkCommand(at);
    remove.execute();
    expect(active.timeline.bookmarks).toEqual([]);
    remove.undo();
    expect(active.timeline.bookmarks).toEqual([{ time: at }]);
    expect(document.getTimeline().tracks).toBe(tracks);
  });

  it("round-trips tracks, bookmarks and view state, stripping runtime audio buffers", async () => {
    let record: SerializedProject | null = null;
    const repository = {
      read: async () => structuredClone(record),
      save: async (value: SerializedProject) => {
        record = structuredClone(value);
      },
    } as ProjectRepository;
    const storage = new StorageService(repository, {} as AssetRepository);
    active.timeline.bookmarks.push({
      time: mediaTime({ ticks: 120000 }),
      note: "Bookmark",
    });
    active.timeline.tracks.audio.push({
      id: "audio",
      name: "Audio",
      type: "audio",
      muted: false,
      elements: [
        {
          id: "clip",
          name: "Audio",
          type: "audio",
          sourceType: "upload",
          mediaId: "stable-asset",
          startTime: mediaTime({ ticks: 0 }),
          duration: mediaTime({ ticks: 240000 }),
          trimStart: mediaTime({ ticks: 0 }),
          trimEnd: mediaTime({ ticks: 0 }),
          params: { volume: 1 },
          buffer: { runtime: true } as unknown as AudioBuffer,
        },
      ],
    });
    active.timeline.tracks.order = ["audio", active.timeline.tracks.main.id];
    await storage.saveProject({ project: active });
    expect(record).not.toHaveProperty("scenes");
    expect(record).not.toHaveProperty("currentSceneId");
    expect(record!.timeline.tracks.audio[0].elements[0]).not.toHaveProperty(
      "buffer",
    );
    const loaded = (await storage.loadProject({ id: active.metadata.id }))!
      .project;
    expect(loaded.timeline.tracks.order).toEqual(active.timeline.tracks.order);
    expect(loaded.timelineViewState).toEqual(active.timelineViewState);
    expect(loaded.timeline.bookmarks).toEqual(active.timeline.bookmarks);
    expect(loaded.timeline.tracks.main.id).toBe(active.timeline.tracks.main.id);
    expect(loaded.metadata.createdAt).toEqual(active.metadata.createdAt);
    expect(loaded.timeline.tracks.audio[0].elements[0].mediaId).toBe(
      "stable-asset",
    );
  });

  it("rejects previous formats without converting or overwriting them", async () => {
    const repository = {
      read: async () => ({ ...project(), version: 1 }),
      save: vi.fn(),
    } as unknown as ProjectRepository;
    const storage = new StorageService(repository, {} as AssetRepository);
    await expect(storage.loadProject({ id: "project" })).rejects.toThrow(
      "Unsupported local project version: 1",
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("clears project state and does not leak bookmarks into another project", () => {
    new ToggleBookmarkCommand(mediaTime({ ticks: 120000 })).execute();
    document.clear();
    expect(document.getTimelineOrNull()).toBeNull();
    expect(() => document.getTimeline()).toThrow("No open project timeline");
    active = project();
    document.initialize(active.timeline);
    expect(document.getTimeline().bookmarks).toEqual([]);
    expect(document.getTimeline().tracks.main.elements).toEqual([]);
  });

  it("marks single-timeline edits dirty and retains unsaved state on storage failure", async () => {
    const saveCurrentProject = vi
      .fn()
      .mockRejectedValueOnce(new Error("Quota exceeded"))
      .mockResolvedValue(undefined);
    const editor = {
      document,
      timeline: { subscribe: () => () => {} },
      project: { getActiveOrNull: () => active, saveCurrentProject },
      notifications: { emit: vi.fn() },
    } as unknown as EditorCore;
    const save = new SaveManager({ editor });
    save.start();
    try {
      new ToggleBookmarkCommand(mediaTime({ ticks: 120000 })).execute();
      expect(save.getIsDirty()).toBe(true);
      await expect(save.flush()).rejects.toThrow("Quota exceeded");
      expect(save.getIsDirty()).toBe(true);
      expect(editor.notifications.emit).toHaveBeenCalledOnce();
      await save.flush();
      expect(save.getIsDirty()).toBe(false);
    } finally {
      save.stop();
    }
  });
});
