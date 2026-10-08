import { getOrderedTracks, insertTrackAtIndex } from "@/timeline/track-order";
import type {
  AudioTrack,
  OverlayTrack,
  TimelineTracks,
  TextTrack,
  TimelineElement,
  TimelineTrack,
  VideoTrack,
} from "@/timeline";
import { generateUUID } from "@/utils/id";
import { buildEmptyTrack } from "./track-factory";
import type { PlacementResult } from "./types";
import { updateTrackInTimelineTracks } from "@/timeline/track-element-update";

export function applyPlacement({
  tracks,
  placementResult,
  elements,
  newTrackInsertIndexOverride,
}: {
  tracks: TimelineTracks;
  placementResult: PlacementResult;
  elements: TimelineElement[];
  newTrackInsertIndexOverride?: number;
}): { updatedTracks: TimelineTracks; targetTrackId: string } | null {
  const orderedTracks = getOrderedTracks(tracks);
  if (placementResult.kind === "existingTrack") {
    const targetTrack = orderedTracks[placementResult.trackIndex];
    if (!targetTrack) {
      return null;
    }

    const updatedTracks = updateTrackInTimelineTracks({
      tracks,
      trackId: targetTrack.id,
      update: (track) => ({
        ...track,
        elements: [...track.elements, ...elements],
      }),
    });

    return { updatedTracks, targetTrackId: targetTrack.id };
  }

  const newTrackId = generateUUID();
  const insertIndex =
    newTrackInsertIndexOverride ?? placementResult.insertIndex;
  const track =
    placementResult.trackType === "audio"
      ? buildPlacedAudioTrack({ id: newTrackId, elements })
      : buildPlacedOverlayTrack({
          id: newTrackId,
          type: placementResult.trackType,
          elements,
        });
  const updatedTracks = insertTrackAtIndex(tracks, track, insertIndex);
  return { updatedTracks, targetTrackId: newTrackId };
}

function buildPlacedAudioTrack({
  id,
  elements,
}: {
  id: string;
  elements: TimelineElement[];
}): AudioTrack {
  return {
    ...buildEmptyTrack({ id, type: "audio" }),
    elements: elements as AudioTrack["elements"],
  };
}

function buildPlacedOverlayTrack({
  id,
  type,
  elements,
}: {
  id: string;
  type: Exclude<OverlayTrack["type"], "audio">;
  elements: TimelineElement[];
}): OverlayTrack {
  switch (type) {
    case "video":
      return {
        ...buildEmptyTrack({ id, type: "video" }),
        elements: elements as VideoTrack["elements"],
      };
    case "text":
      return {
        ...buildEmptyTrack({ id, type: "text" }),
        elements: elements as TextTrack["elements"],
      };
  }
}
