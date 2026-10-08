import { getOrderedTracks } from "@/timeline/track-order";
import type { TimelineTracks, TimelineTrack } from "@/timeline";
import type { GroupTrackSection } from "./types";

export interface TrackPlacement {
  trackId: string;
  trackType: TimelineTrack["type"];
  section: GroupTrackSection;
  sectionIndex: number;
  displayIndex: number;
}

export function getDisplayTracks({
  tracks,
}: {
  tracks: TimelineTracks;
}): TimelineTrack[] {
  return getOrderedTracks(tracks);
}

export function getTrackPlacementById({
  tracks,
  trackId,
}: {
  tracks: TimelineTracks;
  trackId: string;
}): TrackPlacement | null {
  if (tracks.main.id === trackId) {
    return {
      trackId,
      trackType: tracks.main.type,
      section: "main",
      sectionIndex: -1,
      displayIndex: getOrderedTracks(tracks).findIndex(
        (track) => track.id === trackId,
      ),
    };
  }

  const overlayTrackIndex = tracks.overlay.findIndex(
    (track) => track.id === trackId,
  );
  if (overlayTrackIndex >= 0) {
    return {
      trackId,
      trackType: tracks.overlay[overlayTrackIndex].type,
      section: "overlay",
      sectionIndex: overlayTrackIndex,
      displayIndex: getOrderedTracks(tracks).findIndex(
        (track) => track.id === trackId,
      ),
    };
  }

  const audioTrackIndex = tracks.audio.findIndex(
    (track) => track.id === trackId,
  );
  if (audioTrackIndex >= 0) {
    return {
      trackId,
      trackType: tracks.audio[audioTrackIndex].type,
      section: "audio",
      sectionIndex: audioTrackIndex,
      displayIndex: getOrderedTracks(tracks).findIndex(
        (track) => track.id === trackId,
      ),
    };
  }

  return null;
}

export function getTrackPlacementByDisplayIndex({
  tracks,
  displayIndex,
}: {
  tracks: TimelineTracks;
  displayIndex: number;
}): TrackPlacement | null {
  const displayTracks = getDisplayTracks({ tracks });
  const track = displayTracks[displayIndex];
  if (!track) {
    return null;
  }

  return getTrackPlacementById({
    tracks,
    trackId: track.id,
  });
}
