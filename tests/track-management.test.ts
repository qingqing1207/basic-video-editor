import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorCore } from "@/core";
import { CommandManager } from "@/core/managers/commands";
import { buildDefaultTimeline } from "@/timeline/document";
import {
  buildEmptyTrack,
  applyPlacement,
  resolveTrackPlacement,
} from "@/timeline/placement";
import {
  getOrderedTracks,
  insertTrackAtIndex,
  moveTrackToIndex,
  removeTrackById,
} from "@/timeline/track-order";
import {
  AddTrackCommand,
  RemoveTrackCommand,
  MoveTrackCommand,
} from "@/commands/timeline/track";
import { DeleteElementsCommand } from "@/commands/timeline/element/delete-elements";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { buildScene } from "@/services/renderer/scene-builder";
import { getVisibleElementsWithBounds } from "@/preview/element-bounds";
import type { MediaAsset } from "@/media/types";
import { mediaTime } from "@/wasm";
import type { EditorSelectionSnapshot } from "@/selection/editor-selection";
import type { TimelineTracks } from "@/timeline";
import { computeDropTarget } from "@/timeline/components/drop-target";
const state = vi.hoisted(() => ({ editor: null as unknown }));
vi.mock("@/core", () => ({ EditorCore: { getInstance: () => state.editor } }));
const ids = (tracks: TimelineTracks) =>
  getOrderedTracks(tracks).map((track) => track.id);
const video = (id: string) => buildEmptyTrack({ id, type: "video" });
const element = () =>
  buildElementFromMedia({
    mediaId: "media",
    mediaType: "video",
    name: "Clip",
    startTime: mediaTime({ ticks: 120000 }),
    duration: mediaTime({ ticks: 240000 }),
  });

describe("track management", () => {
  let tracks: TimelineTracks;
  let selection: EditorSelectionSnapshot;
  let commands: CommandManager;
  beforeEach(() => {
    tracks = {
      overlay: [video("top"), video("middle")],
      main: video("main"),
      audio: [buildEmptyTrack({ id: "audio", type: "audio" })],
    };
    selection = {
      selectedElements: [],
      selectedKeyframes: [],
      keyframeSelectionAnchor: null,
      selectedMaskPoints: null,
    };
    const editor = {
      document: {
        getTimeline: () => ({ tracks, bookmarks: [] }),
        getTimelineOrNull: () => ({ tracks, bookmarks: [] }),
      },
      timeline: {
        updateTracks: (value: TimelineTracks) => {
          tracks = value;
        },
      },
      selection: {
        getSnapshot: () => selection,
        applySelectionPatch: ({ patch }: any) =>
          (selection = { ...selection, ...patch }),
        restoreSnapshot: ({ snapshot }: any) => {
          selection = snapshot;
        },
      },
    } as unknown as EditorCore;
    state.editor = editor;
    commands = new CommandManager(editor);
  });
  it("swaps neighbors across main/audio boundaries without changing clips or identities, with undo/redo", () => {
    const clip = element();
    if (clip.type !== "video") throw Error();
    tracks.main.elements = [clip];
    const original = tracks;
    commands.execute({ command: new MoveTrackCommand("main", 0) });
    expect(ids(tracks)).toEqual(["main", "top", "middle", "audio"]);
    expect(tracks.main).toBe(original.main);
    commands.execute({ command: new MoveTrackCommand("audio", 1) });
    expect(ids(tracks)).toEqual(["main", "audio", "top", "middle"]);
    commands.undo();
    commands.undo();
    expect(tracks).toBe(original);
    commands.redo();
    commands.redo();
    expect(ids(tracks)).toEqual(["main", "audio", "top", "middle"]);
    expect(tracks.main.elements[0]).toBe(clip);
  });
  it("adds a track without an index at the end of the list for every type, with undo", () => {
    for (const type of ["video", "text", "audio"] as const) {
      const before = ids(tracks);
      const add = new AddTrackCommand({ type });
      commands.execute({ command: add });
      expect(ids(tracks)).toEqual([...before, add.getTrackId()]);
      expect(getOrderedTracks(tracks).at(-1)?.type).toBe(type);
      commands.undo();
      expect(ids(tracks)).toEqual(before);
    }
  });
  it("keeps explicitly added empty tracks through subsequent commands", () => {
    const add = new AddTrackCommand({ type: "text", index: 4 });
    commands.execute({ command: add });
    commands.execute({ command: new MoveTrackCommand(add.getTrackId(), 0) });
    commands.execute({ command: new DeleteElementsCommand({ elements: [] }) });
    expect(ids(tracks)[0]).toBe(add.getTrackId());
    expect(getOrderedTracks(tracks)[0].elements).toEqual([]);
    commands.undo();
    commands.undo();
    commands.undo();
    expect(ids(tracks)).toEqual(["top", "middle", "main", "audio"]);
  });
  it("deletes occupied main track, promotes another video, restores content and selection on undo", () => {
    const clip = element();
    if (clip.type !== "video") throw Error();
    tracks.main.elements = [clip];
    selection.selectedElements = [{ trackId: "main", elementId: clip.id }];
    const original = tracks;
    commands.execute({ command: new RemoveTrackCommand("main") });
    expect(ids(tracks)).toEqual(["top", "middle", "audio"]);
    expect(tracks.main.id).toBe("middle");
    expect(selection.selectedElements).toEqual([]);
    commands.undo();
    expect(tracks).toBe(original);
    expect(selection.selectedElements).toEqual([
      { trackId: "main", elementId: clip.id },
    ]);
    commands.redo();
    expect(ids(tracks)).not.toContain("main");
  });
  it("retains one empty video anchor after deleting the last video, stable on redo", () => {
    tracks = buildDefaultTimeline().tracks;
    const original = tracks.main.id;
    commands.execute({ command: new RemoveTrackCommand(original) });
    const fallback = tracks.main.id;
    expect(fallback).not.toBe(original);
    expect(tracks.main.elements).toEqual([]);
    expect(ids(tracks)).toEqual([fallback]);
    commands.undo();
    commands.redo();
    expect(tracks.main.id).toBe(fallback);
  });
  it("resolves drop by visible order and applies to exactly that track after reorder", () => {
    tracks = moveTrackToIndex(tracks, "audio", 0);
    tracks = moveTrackToIndex(tracks, "main", 1);
    const result = resolveTrackPlacement({
      tracks,
      elementType: "video",
      timeSpans: [
        {
          startTime: mediaTime({ ticks: 120000 }),
          duration: mediaTime({ ticks: 240000 }),
        },
      ],
      strategy: { type: "preferIndex", trackIndex: 2, hoverDirection: "below" },
    })!;
    expect(result).toMatchObject({
      kind: "existingTrack",
      trackId: "top",
      trackIndex: 2,
    });
    const clip = element();
    const applied = applyPlacement({
      tracks,
      elements: [clip],
      placementResult: result,
    })!;
    expect(applied.targetTrackId).toBe("top");
    expect(ids(applied.updatedTracks)).toEqual([
      "audio",
      "main",
      "top",
      "middle",
    ]);
    expect(applied.updatedTracks.overlay[0].elements).toContain(clip);
    const drop = computeDropTarget({
      elementType: "audio",
      mouseX: 0,
      mouseY: 20,
      tracks,
      playheadTime: mediaTime({ ticks: 0 }),
      isExternalDrop: false,
      elementDuration: mediaTime({ ticks: 240000 }),
      pixelsPerSecond: 100,
      zoomLevel: 1,
    });
    expect(drop).toMatchObject({ trackIndex: 0, isNewTrack: false });
  });
  it("uses the same stack for preview, export and canvas hit-testing after main moves above overlays", () => {
    const mediaAssets: MediaAsset[] = [];
    for (const track of [tracks.main, ...tracks.overlay]) {
      const clip = { ...element(), mediaId: track.id };
      if (clip.type !== "video") throw Error();
      track.elements = [clip];
      mediaAssets.push({
        id: track.id,
        name: track.id,
        type: "video",
        file: new File([], track.id),
        url: `blob:${track.id}`,
        width: 240,
        height: 160,
      });
    }
    tracks = moveTrackToIndex(tracks, "main", 0);
    const canvasSize = { width: 240, height: 160 };
    const expected = ["middle", "top", "main"];
    for (const isPreview of [true, false]) {
      const scene = buildScene({
        tracks,
        canvasSize,
        mediaAssets,
        duration: 360000,
        background: { type: "color", color: "transparent" },
        isPreview,
      });
      expect(
        scene.children.map(
          (node) => (node.params as { mediaId: string }).mediaId,
        ),
      ).toEqual(expected);
    }
    expect(
      getVisibleElementsWithBounds({
        tracks,
        currentTime: 120000,
        canvasSize,
        mediaAssets,
      }).map((hit) => hit.trackId),
    ).toEqual(expected);
  });
  it("inserts and removes tracks at their visible positions, preserving serializable order", () => {
    tracks = moveTrackToIndex(tracks, "main", 0);
    tracks = insertTrackAtIndex(
      tracks,
      buildEmptyTrack({ id: "text", type: "text" }),
      4,
    );
    expect(ids(tracks)).toEqual(["main", "top", "middle", "audio", "text"]);
    tracks = removeTrackById(tracks, "middle", video("fallback"));
    expect(ids(JSON.parse(JSON.stringify(tracks)))).toEqual([
      "main",
      "top",
      "audio",
      "text",
    ]);
  });
});
