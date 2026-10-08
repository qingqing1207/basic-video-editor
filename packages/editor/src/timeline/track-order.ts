import type {
  TimelineTrack,
  TimelineTracks,
  VideoTrack,
  OverlayTrack,
} from "./types";

/** Older projects use the original overlay/main/audio ordering. */
export function getOrderedTracks(tracks: TimelineTracks): TimelineTrack[] {
  const available = new Map(
    [...tracks.overlay, tracks.main, ...tracks.audio].map((track) => [
      track.id,
      track,
    ]),
  );
  const ordered: TimelineTrack[] = [];
  for (const id of tracks.order ?? []) {
    const track = available.get(id);
    if (track) {
      ordered.push(track);
      available.delete(id);
    }
  }
  return [...ordered, ...available.values()];
}

function withOrderedTracks(
  tracks: TimelineTracks,
  ordered: TimelineTrack[],
): TimelineTracks {
  return {
    ...tracks,
    order: ordered.map((track) => track.id),
    overlay: ordered.filter(
      (track): track is OverlayTrack =>
        track.id !== tracks.main.id && track.type !== "audio",
    ),
    audio: ordered.filter((track) => track.type === "audio"),
  };
}

export function insertTrackAtIndex(
  tracks: TimelineTracks,
  track: TimelineTrack,
  index: number,
): TimelineTracks {
  const ordered = getOrderedTracks(tracks);
  ordered.splice(Math.max(0, Math.min(index, ordered.length)), 0, track);
  return withOrderedTracks(tracks, ordered);
}

export function moveTrackToIndex(
  tracks: TimelineTracks,
  trackId: string,
  index: number,
): TimelineTracks {
  const ordered = getOrderedTracks(tracks);
  const from = ordered.findIndex((track) => track.id === trackId);
  const to = Math.max(0, Math.min(index, ordered.length - 1));
  if (from < 0 || from === to) return tracks;
  const [track] = ordered.splice(from, 1);
  ordered.splice(to, 0, track);
  return withOrderedTracks(tracks, ordered);
}

/** Keep the required video anchor, promoting an existing video track if possible. */
export function removeTrackById(
  tracks: TimelineTracks,
  trackId: string,
  fallback: VideoTrack,
): TimelineTracks {
  const ordered = getOrderedTracks(tracks);
  const index = ordered.findIndex((track) => track.id === trackId);
  if (index < 0) return tracks;
  ordered.splice(index, 1);
  let main = tracks.main;
  if (main.id === trackId) {
    main =
      ordered.findLast(
        (track): track is VideoTrack => track.type === "video",
      ) ?? fallback;
    if (main === fallback)
      ordered.splice(Math.min(index, ordered.length), 0, fallback);
  }
  return withOrderedTracks({ ...tracks, main }, ordered);
}
