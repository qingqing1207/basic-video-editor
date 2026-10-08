import { getOrderedTracks } from "@/timeline/track-order";
import { addMediaTime, type MediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import type { TimelineTracks } from "./types";

export * from "./types";
export * from "./drag";
export * from "./track-capabilities";
export * from "./track-element-update";
export * from "./element-utils";
export * from "./audio-separation";
export * from "./zoom-utils";
export * from "./ruler-utils";
export * from "./pixel-utils";

export function calculateTotalDuration({
  tracks,
}: {
  tracks: TimelineTracks;
}): MediaTime {
  const orderedTracks = getOrderedTracks(tracks);
  if (orderedTracks.length === 0) return ZERO_MEDIA_TIME;

  let maxEnd: MediaTime = ZERO_MEDIA_TIME;
  for (const track of orderedTracks) {
    for (const element of track.elements) {
      const elementEnd = addMediaTime({
        a: element.startTime,
        b: element.duration,
      });
      if (elementEnd > maxEnd) maxEnd = elementEnd;
    }
  }
  return maxEnd;
}
