import { expect, it } from "vitest";
import { computeDropTarget } from "@/timeline/components/drop-target";
import { buildDefaultTimeline } from "@/timeline/document";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { mediaTime } from "@/wasm";

it.each(["video", "image"] as const)(
  "dragging %s over an occupied clip creates an insertion track",
  (elementType) => {
    const { tracks } = buildDefaultTimeline();
    const original = {
      ...buildElementFromMedia({
        mediaId: "original-media",
        mediaType: "video",
        name: "Original",
        startTime: mediaTime({ ticks: 0 }),
        duration: mediaTime({ ticks: 1200000 }),
      }),
      id: "original",
    };
    if (original.type !== "video") throw new Error("Invalid fixture");
    tracks.main.elements.push(original);
    const target = computeDropTarget({
      elementType,
      mouseX: 500,
      mouseY: 30,
      tracks,
      playheadTime: mediaTime({ ticks: 0 }),
      isExternalDrop: false,
      elementDuration: mediaTime({ ticks: 240000 }),
      pixelsPerSecond: 100,
      zoomLevel: 1,
    });
    expect(target.isNewTrack).toBe(true);
    expect(target.xPosition).toBe(600000);
    expect(tracks.main.elements).toEqual([original]);
  },
);

it("still inserts into an empty main track", () => {
  const { tracks } = buildDefaultTimeline();
  const target = computeDropTarget({
    elementType: "video",
    mouseX: 0,
    mouseY: 30,
    tracks,
    playheadTime: mediaTime({ ticks: 0 }),
    isExternalDrop: false,
    elementDuration: mediaTime({ ticks: 240000 }),
    pixelsPerSecond: 100,
    zoomLevel: 1,
  });
  expect(target.isNewTrack).toBe(false);
  expect(target.trackIndex).toBe(0);
  expect(target.xPosition).toBe(0);
});
