import { getOrderedTracks } from "@/timeline/track-order";
import { getElementKeyframes } from "@/animation";
import type { TimelineTracks } from "@/timeline";
import type { SnapPoint } from "@/timeline/snapping";
import { addMediaTime } from "@/wasm";

export function getAnimationKeyframeSnapPointsForTimeline({
  tracks,
  excludeElementIds,
}: {
  tracks: TimelineTracks;
  excludeElementIds?: Set<string>;
}): SnapPoint[] {
  const snapPoints: SnapPoint[] = [];
  const orderedTracks = getOrderedTracks(tracks);

  for (const track of orderedTracks) {
    for (const element of track.elements) {
      if (excludeElementIds?.has(element.id)) {
        continue;
      }

      for (const keyframe of getElementKeyframes({
        animations: element.animations,
      })) {
        snapPoints.push({
          time: addMediaTime({ a: element.startTime, b: keyframe.time }),
          type: "keyframe",
          elementId: element.id,
          trackId: track.id,
        });
      }
    }
  }

  return snapPoints;
}
