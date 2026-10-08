import { getOrderedTracks, insertTrackAtIndex } from "@/timeline/track-order";
import {
  Command,
  createElementSelectionResult,
  type CommandResult,
} from "@/commands/base-command";
import { EditorCore } from "@/core";
import type {
  TimelineTracks,
  TimelineElement,
  TimelineTrack,
} from "@/timeline";
import {
  buildEmptyTrack,
  validateElementTrackCompatibility,
} from "@/timeline/placement";
import type {
  PlannedElementMove,
  PlannedTrackCreation,
} from "@/timeline/group-move";
import { findTrackInTimelineTracks } from "@/timeline/track-element-update";

export class MoveElementCommand extends Command {
  private savedState: TimelineTracks | null = null;

  constructor({
    moves,
    createTracks = [],
  }: {
    moves: PlannedElementMove[];
    createTracks?: PlannedTrackCreation[];
  }) {
    super();
    this.moves = moves;
    this.createTracks = createTracks;
  }

  private readonly moves: PlannedElementMove[];
  private readonly createTracks: PlannedTrackCreation[];

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.document.getTimeline().tracks;

    let tracksToUpdate = this.savedState;
    for (const createTrack of [...this.createTracks].sort(
      (firstTrack, secondTrack) => firstTrack.index - secondTrack.index,
    )) {
      tracksToUpdate = insertTrackAtDisplayIndex({
        tracks: tracksToUpdate,
        track: buildEmptyTrack({
          id: createTrack.id,
          type: createTrack.type,
        }),
        insertIndex: createTrack.index,
      });
    }

    const movedElementsById = new Map<string, TimelineElement>();
    for (const move of this.moves) {
      const sourceTrack = findTrackInTimelineTracks({
        tracks: this.savedState,
        trackId: move.sourceTrackId,
      });
      const sourceElement = sourceTrack?.elements.find(
        (trackElement) => trackElement.id === move.elementId,
      );
      if (!sourceTrack || !sourceElement) {
        throw new Error("Source track or element not found");
      }

      const targetTrack = findTrackInTimelineTracks({
        tracks: tracksToUpdate,
        trackId: move.targetTrackId,
      });
      if (!targetTrack) {
        throw new Error("Target track not found");
      }

      const validation = validateElementTrackCompatibility({
        element: sourceElement,
        track: targetTrack,
      });
      if (!validation.isValid) {
        throw new Error(validation.errorMessage);
      }

      movedElementsById.set(move.elementId, {
        ...sourceElement,
        startTime: move.newStartTime,
      });
    }

    const movedElementIds = new Set(this.moves.map((move) => move.elementId));
    const movedElementsByTargetTrackId = new Map<string, TimelineElement[]>();
    for (const move of this.moves) {
      const movedElement = movedElementsById.get(move.elementId);
      if (!movedElement) {
        continue;
      }

      const nextTargetElements =
        movedElementsByTargetTrackId.get(move.targetTrackId) ?? [];
      nextTargetElements.push(movedElement);
      movedElementsByTargetTrackId.set(move.targetTrackId, nextTargetElements);
    }

    const updatedTracks = mapTimelineTracks({
      tracks: tracksToUpdate,
      update: (track) => ({
        ...track,
        elements: [
          ...track.elements.filter(
            (element) => !movedElementIds.has(element.id),
          ),
          ...(movedElementsByTargetTrackId.get(track.id) ?? []),
        ],
      }),
    });

    // Compute cleanup before publishing: subscribers, autosave and rendering
    // must never observe the transient extra track left by a cross-track move.
    const sourceTrackIds = new Set(
      this.moves.map((move) => move.sourceTrackId),
    );
    const ordered = getOrderedTracks(updatedTracks);
    const emptiedSourceIds = new Set(
      ordered
        .filter(
          (track) =>
            sourceTrackIds.has(track.id) && track.elements.length === 0,
        )
        .map((track) => track.id),
    );
    let finalTracks = updatedTracks;
    if (emptiedSourceIds.size > 0) {
      const remaining = ordered.filter(
        (track) => !emptiedSourceIds.has(track.id),
      );
      let main = updatedTracks.main;
      if (emptiedSourceIds.has(main.id)) {
        // A main-track clip can only move to another video track. Promote its
        // actual destination without inserting a replacement empty anchor.
        const destinationIds = new Set(
          this.moves
            .filter((move) => move.sourceTrackId === main.id)
            .map((move) => move.targetTrackId),
        );
        const destination = remaining.find(
          (track) => track.type === "video" && destinationIds.has(track.id),
        );
        if (!destination || destination.type !== "video") {
          throw new Error(
            "Moving the main track requires a surviving video destination",
          );
        }
        main = destination;
      }
      finalTracks = {
        ...updatedTracks,
        main,
        order: remaining.map((track) => track.id),
        overlay: remaining.filter(
          (track): track is TimelineTracks["overlay"][number] =>
            track.type !== "audio" && track.id !== main.id,
        ),
        audio: remaining.filter((track) => track.type === "audio"),
      };
    }

    editor.timeline.updateTracks(finalTracks);
    return createElementSelectionResult(
      this.moves.map(({ elementId, targetTrackId }) => ({
        trackId: targetTrackId,
        elementId,
      })),
    );
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}

function mapTimelineTracks({
  tracks,
  update,
}: {
  tracks: TimelineTracks;
  update: <TTrack extends TimelineTrack>(track: TTrack) => TTrack;
}): TimelineTracks {
  return {
    ...tracks,
    overlay: tracks.overlay.map((track) => update(track)),
    main: update(tracks.main),
    audio: tracks.audio.map((track) => update(track)),
  };
}

function insertTrackAtDisplayIndex({
  tracks,
  track,
  insertIndex,
}: {
  tracks: TimelineTracks;
  track: TimelineTrack;
  insertIndex: number;
}): TimelineTracks {
  return insertTrackAtIndex(tracks, track, insertIndex);
}
