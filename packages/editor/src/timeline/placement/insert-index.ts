import type { TimelineTracks, TrackType } from "@/timeline";
import { getOrderedTracks } from "@/timeline/track-order";

export function getDefaultInsertIndexForTrack({
  tracks,
  trackType,
}: {
  tracks: TimelineTracks;
  trackType: TrackType;
}): number {
  const ordered = getOrderedTracks(tracks);
  return trackType === "audio"
    ? ordered.length
    : ordered.findIndex((track) => track.id === tracks.main.id);
}
export function getHighestInsertIndexForTrack({
  tracks,
  trackType,
}: {
  tracks: TimelineTracks;
  trackType: TrackType;
}): number {
  const ordered = getOrderedTracks(tracks);
  if (trackType !== "audio") return 0;
  const firstAudio = ordered.findIndex((track) => track.type === "audio");
  return firstAudio < 0
    ? ordered.findIndex((track) => track.id === tracks.main.id) + 1
    : firstAudio;
}
export function resolvePreferredNewTrackPlacement({
  tracks,
  preferredIndex,
  direction,
}: {
  tracks: TimelineTracks;
  trackType: TrackType;
  preferredIndex: number;
  direction: "above" | "below";
}): { insertIndex: number; insertPosition: "above" | "below" | null } {
  const count = getOrderedTracks(tracks).length;
  const index = Math.max(0, Math.min(preferredIndex, count - 1));
  return {
    insertIndex: count === 0 ? 0 : index + (direction === "below" ? 1 : 0),
    insertPosition: direction,
  };
}
