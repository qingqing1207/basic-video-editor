import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorCore } from "@/core";
import { CommandManager } from "@/core/managers/commands";
import { MoveElementCommand } from "@/commands/timeline/element/move-elements";
import { buildEmptyTrack } from "@/timeline/placement";
import { buildElementFromMedia } from "@/timeline/element-utils";
import {
  buildMoveGroup,
  resolveGroupMove,
  type PlannedElementMove,
} from "@/timeline/group-move";
import { getOrderedTracks } from "@/timeline/track-order";
import type {
  TimelineTracks,
  VideoElement,
  UploadAudioElement,
} from "@/timeline";
import type { EditorSelectionSnapshot } from "@/selection/editor-selection";
import { mediaTime } from "@/wasm";

const state = vi.hoisted(() => ({ editor: null as unknown }));
vi.mock("@/core", () => ({ EditorCore: { getInstance: () => state.editor } }));
const time = (ticks: number) => mediaTime({ ticks });
const clip = (id: string, start = 0) =>
  ({
    ...buildElementFromMedia({
      mediaId: id,
      mediaType: "video",
      name: id,
      startTime: time(start),
      duration: time(120000),
    }),
    id,
  }) as VideoElement;
const video = (id: string, ...elements: VideoElement[]) => ({
  ...buildEmptyTrack({ id, type: "video" }),
  elements,
});
const ids = (tracks: TimelineTracks) =>
  getOrderedTracks(tracks).map((t) => t.id);
const move = (
  sourceTrackId: string,
  targetTrackId: string,
  elementId: string,
  start = 0,
): PlannedElementMove => ({
  sourceTrackId,
  targetTrackId,
  elementId,
  newStartTime: time(start),
});

describe("moving clips atomically removes only emptied source tracks", () => {
  let tracks: TimelineTracks;
  let selection: EditorSelectionSnapshot;
  let commands: CommandManager;
  let published: TimelineTracks[];
  beforeEach(() => {
    tracks = {
      overlay: [video("source", clip("a")), video("manual-empty")],
      main: video("main", clip("b")),
      audio: [],
    };
    selection = {
      selectedElements: [{ trackId: "source", elementId: "a" }],
      selectedKeyframes: [],
      keyframeSelectionAnchor: null,
      selectedMaskPoints: null,
    };
    published = [];
    state.editor = {
      document: {
        getTimeline: () => ({ tracks }),
        getTimelineOrNull: () => ({ tracks }),
      },
      timeline: {
        updateTracks: (next: TimelineTracks) => {
          tracks = next;
          published.push(next);
        },
      },
      selection: {
        getSnapshot: () => selection,
        applySelectionPatch: ({
          patch,
        }: {
          patch: Partial<EditorSelectionSnapshot>;
        }) => (selection = { ...selection, ...patch }),
        restoreSnapshot: ({
          snapshot,
        }: {
          snapshot: EditorSelectionSnapshot;
        }) => {
          selection = snapshot;
        },
      },
    };
    commands = new CommandManager(state.editor as EditorCore);
  });

  it("publishes only the final inserted-track state and restores it in one undo/redo", () => {
    const original = tracks;
    const previousSelection = selection;
    commands.execute({
      command: new MoveElementCommand({
        moves: [move("source", "new", "a", 120000)],
        createTracks: [{ id: "new", type: "video", index: 3 }],
      }),
    });
    expect(published).toHaveLength(1);
    expect(ids(tracks)).toEqual(["manual-empty", "main", "new"]);
    expect(selection.selectedElements).toEqual([
      { trackId: "new", elementId: "a" },
    ]);
    const final = tracks;
    expect(final.overlay.find((t) => t.id === "new")?.elements[0]).toEqual({
      ...original.overlay[0].elements[0],
      startTime: time(120000),
    });
    commands.undo();
    expect(tracks).toBe(original);
    expect(selection).toBe(previousSelection);
    expect(commands.canUndo()).toBe(false);
    commands.redo();
    expect(tracks).toEqual(final);
    expect(published).toHaveLength(3);
  });

  it("merges into existing free space, preserving unrelated user-created empty tracks", () => {
    commands.execute({
      command: new MoveElementCommand({
        moves: [move("source", "main", "a", 120000)],
      }),
    });
    expect(ids(tracks)).toEqual(["manual-empty", "main"]);
    expect(tracks.main.elements.map((e) => e.id)).toEqual(["b", "a"]);
    expect(published).toHaveLength(1);
  });

  it("keeps partially emptied sources and same-track horizontal moves", () => {
    tracks.overlay[0].elements.push(clip("a2", 240000));
    commands.execute({
      command: new MoveElementCommand({
        moves: [move("source", "main", "a", 120000)],
      }),
    });
    expect(tracks.overlay[0].elements.map((e) => e.id)).toEqual(["a2"]);
    commands.execute({
      command: new MoveElementCommand({
        moves: [move("source", "source", "a2", 360000)],
      }),
    });
    expect(ids(tracks)).toContain("source");
    expect(tracks.overlay[0].elements[0].startTime).toBe(360000);
  });

  it.each([false, true])(
    "removes multi-selection video/audio sources with ripple=%s using the actual group planner",
    (ripple) => {
      const audio = {
        ...buildElementFromMedia({
          mediaId: "sound",
          mediaType: "audio",
          name: "sound",
          startTime: time(0),
          duration: time(120000),
        }),
        id: "sound",
      } as UploadAudioElement;
      tracks.audio = [
        {
          ...buildEmptyTrack({ id: "sound-track", type: "audio" }),
          elements: [audio],
        },
      ];
      tracks.overlay[0].elements.push(clip("a2", 240000));
      const refs = [
        { trackId: "source", elementId: "a" },
        { trackId: "source", elementId: "a2" },
        { trackId: "sound-track", elementId: "sound" },
      ];
      const group = buildMoveGroup({
        anchorRef: refs[0],
        selectedElements: refs,
        tracks,
      })!;
      const planned = resolveGroupMove({
        group,
        tracks,
        anchorStartTime: time(120000),
        target: {
          kind: "newTracks",
          anchorInsertIndex: 0,
          newTrackIds: ["new-video", "unused", "new-audio"],
        },
      })!;
      expect(planned).not.toBeNull();
      const original = tracks;
      commands.isRippleEnabled = ripple;
      commands.execute({ command: new MoveElementCommand(planned) });
      expect(ids(tracks)).not.toContain("source");
      expect(ids(tracks)).not.toContain("sound-track");
      expect(ids(tracks)).toContain("manual-empty");
      expect(
        getOrderedTracks(tracks)
          .flatMap((t) => t.elements.map((e) => [e.id, e.startTime]))
          .sort(),
      ).toEqual(
        [
          ["a", 120000],
          ["a2", 360000],
          ["b", 0],
          ["sound", 120000],
        ].sort(),
      );
      expect(published).toHaveLength(1);
      const final = tracks;
      commands.undo();
      expect(tracks).toBe(original);
      commands.redo();
      expect(tracks).toEqual(final);
    },
  );

  it("keeps a source that receives another moved clip in the same operation", () => {
    commands.execute({
      command: new MoveElementCommand({
        moves: [move("source", "main", "a"), move("main", "source", "b")],
      }),
    });
    expect(ids(tracks)).toEqual(["source", "manual-empty", "main"]);
    expect(tracks.overlay[0].elements[0].id).toBe("b");
    expect(tracks.main.elements[0].id).toBe("a");
  });

  it("promotes the actual main-clip destination without changing its position or adding an empty anchor", () => {
    commands.execute({
      command: new MoveElementCommand({
        moves: [move("main", "new-main", "b", 240000)],
        createTracks: [{ id: "new-main", type: "video", index: 0 }],
      }),
    });
    expect(ids(tracks)).toEqual(["new-main", "source", "manual-empty"]);
    expect(tracks.main.id).toBe("new-main");
    expect(tracks.main.elements[0].startTime).toBe(240000);
    expect(tracks.overlay.map((t) => t.id)).not.toContain("new-main");
    commands.undo();
    expect(tracks.main.id).toBe("main");
    commands.redo();
    expect(tracks.main.id).toBe("new-main");
  });

  it("does not accumulate empty sources over 20 back-and-forth moves", () => {
    let source = "source";
    for (let i = 0; i < 20; i++) {
      const target = `new-${i}`;
      commands.execute({
        command: new MoveElementCommand({
          moves: [move(source, target, "a")],
          createTracks: [{ id: target, type: "video", index: i % 2 ? 0 : 3 }],
        }),
      });
      expect(ids(tracks)).toHaveLength(3);
      expect(ids(tracks)).toContain("manual-empty");
      expect(ids(tracks)).not.toContain(source);
      source = target;
    }
    expect(published).toHaveLength(20);
  });

  it("does not publish intermediate created tracks when a move fails validation", () => {
    const original = tracks;
    expect(() =>
      commands.execute({
        command: new MoveElementCommand({
          moves: [move("source", "bad", "a")],
          createTracks: [{ id: "bad", type: "audio", index: 0 }],
        }),
      }),
    ).toThrow();
    expect(tracks).toBe(original);
    expect(published).toHaveLength(0);
    expect(commands.canUndo()).toBe(false);
  });
});
