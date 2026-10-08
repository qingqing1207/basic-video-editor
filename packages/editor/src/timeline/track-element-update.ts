import type {
  TimelineTracks,
  TimelineElement,
  TimelineTrack,
} from "@/timeline";

export function findTrackInTimelineTracks({
  tracks,
  trackId,
}: {
  tracks: TimelineTracks;
  trackId: string;
}): TimelineTrack | null {
  if (tracks.main.id === trackId) {
    return tracks.main;
  }

  return (
    tracks.overlay.find((track) => track.id === trackId) ??
    tracks.audio.find((track) => track.id === trackId) ??
    null
  );
}

export function updateTrackInTimelineTracks({
  tracks,
  trackId,
  update,
}: {
  tracks: TimelineTracks;
  trackId: string;
  update: <TTrack extends TimelineTrack>(track: TTrack) => TTrack;
}): TimelineTracks {
  if (tracks.main.id === trackId) {
    return {
      ...tracks,
      main: update(tracks.main),
    };
  }

  const overlayTrackIndex = tracks.overlay.findIndex(
    (track) => track.id === trackId,
  );
  if (overlayTrackIndex >= 0) {
    return {
      ...tracks,
      overlay: tracks.overlay.map((track, index) =>
        index === overlayTrackIndex ? update(track) : track,
      ),
    };
  }

  const audioTrackIndex = tracks.audio.findIndex(
    (track) => track.id === trackId,
  );
  if (audioTrackIndex >= 0) {
    return {
      ...tracks,
      audio: tracks.audio.map((track, index) =>
        index === audioTrackIndex ? update(track) : track,
      ),
    };
  }

  return tracks;
}

function updateElementInTrack<TTrack extends TimelineTrack>({
  track,
  elementId,
  update,
  elementPredicate,
}: {
  track: TTrack;
  elementId: string;
  update: (element: TimelineElement) => TimelineElement;
  elementPredicate?: (element: TimelineElement) => boolean;
}): TTrack {
  const nextElements = track.elements.map((element) => {
    if (element.id !== elementId) {
      return element;
    }
    if (elementPredicate && !elementPredicate(element)) {
      return element;
    }
    return update(element);
  });

  return {
    ...track,
    elements: nextElements,
  } as TTrack;
}

export function updateElementInTimelineTracks({
  tracks,
  trackId,
  elementId,
  update,
  elementPredicate,
}: {
  tracks: TimelineTracks;
  trackId: string;
  elementId: string;
  update: (element: TimelineElement) => TimelineElement;
  elementPredicate?: (element: TimelineElement) => boolean;
}): TimelineTracks {
  if (tracks.main.id === trackId) {
    return {
      ...tracks,
      main: updateElementInTrack({
        track: tracks.main,
        elementId,
        update,
        elementPredicate,
      }),
    };
  }

  const overlayTrackIndex = tracks.overlay.findIndex(
    (track) => track.id === trackId,
  );
  if (overlayTrackIndex >= 0) {
    return {
      ...tracks,
      overlay: tracks.overlay.map((track, index) =>
        index === overlayTrackIndex
          ? updateElementInTrack({
              track,
              elementId,
              update,
              elementPredicate,
            })
          : track,
      ),
    };
  }

  const audioTrackIndex = tracks.audio.findIndex(
    (track) => track.id === trackId,
  );
  if (audioTrackIndex >= 0) {
    return {
      ...tracks,
      audio: tracks.audio.map((track, index) =>
        index === audioTrackIndex
          ? updateElementInTrack({
              track,
              elementId,
              update,
              elementPredicate,
            })
          : track,
      ),
    };
  }

  return tracks;
}
