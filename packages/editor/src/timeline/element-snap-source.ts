import { getOrderedTracks } from "@/timeline/track-order";
import type { TimelineTracks } from "@/timeline";
import type { SnapPoint } from "@/timeline/snapping";
import { addMediaTime } from "@/wasm";

export function getElementEdgeSnapPoints({
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

      snapPoints.push(
        {
          time: element.startTime,
          type: "element-start",
          elementId: element.id,
          trackId: track.id,
        },
        {
          time: addMediaTime({ a: element.startTime, b: element.duration }),
          type: "element-end",
          elementId: element.id,
          trackId: track.id,
        },
      );
    }
  }

  return snapPoints;
}
