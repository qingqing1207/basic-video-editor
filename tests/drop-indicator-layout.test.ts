import { describe, expect, it } from "vitest";
import {
  computeDropTarget,
  getDropLineY,
} from "@/timeline/components/drop-target";
import { getOrderedTracks } from "@/timeline/track-order";
import { buildEmptyTrack } from "@/timeline/placement";
import { buildElementFromMedia } from "@/timeline/element-utils";
import type {
  DropTarget,
  TimelineTracks,
  VideoElement,
  UploadAudioElement,
} from "@/timeline";
import { mediaTime } from "@/wasm";
const zero = mediaTime({ ticks: 0 });
const duration = mediaTime({ ticks: 120000 });
const tracks: TimelineTracks = {
  overlay: [
    {
      ...buildEmptyTrack({ id: "visual", type: "video" }),
      elements: [
        {
          ...buildElementFromMedia({
            mediaId: "v",
            mediaType: "video",
            name: "v",
            startTime: zero,
            duration,
          }),
          id: "v",
        } as VideoElement,
      ],
    },
  ],
  main: buildEmptyTrack({ id: "main", type: "video" }),
  audio: [
    {
      ...buildEmptyTrack({ id: "sound", type: "audio" }),
      elements: [
        {
          ...buildElementFromMedia({
            mediaId: "a",
            mediaType: "audio",
            name: "a",
            startTime: zero,
            duration,
          }),
          id: "a",
        } as UploadAudioElement,
      ],
    },
  ],
  order: ["visual", "sound", "main"],
};
const ordered = getOrderedTracks(tracks);
const extraHeight = (index: number) => [40, 20, 0][index] ?? 0;
const target = (index: number): DropTarget => ({
  trackIndex: index,
  isNewTrack: true,
  insertPosition: "above",
  xPosition: zero,
});

describe("drop indicator uses scroll-content track geometry", () => {
  it.each([
    [0, 2],
    [1, 113],
    [2, 189],
    [3, 260],
    [-1, 2],
    [99, 260],
  ])(
    "positions insertion %s at %s including expanded lanes and content padding",
    (index, y) => {
      expect(
        getDropLineY({
          dropTarget: target(index),
          tracks: ordered,
          getExtraHeight: extraHeight,
        }),
      ).toBe(y);
    },
  );
  it("uses visible mixed-type order instead of overlay/main/audio section order", () => {
    expect(getDropLineY({ dropTarget: target(2), tracks: ordered })).toBe(129);
  });
  it.each([
    [90, 1],
    [130, 1],
    [170, 2],
  ])(
    "hit testing at y=%s chooses the same expanded-row insertion boundary %s",
    (mouseY, index) => {
      const drop = computeDropTarget({
        elementType: "video",
        mouseX: 0,
        mouseY,
        tracks,
        playheadTime: zero,
        isExternalDrop: false,
        elementDuration: duration,
        pixelsPerSecond: 100,
        zoomLevel: 1,
        getExtraHeight: extraHeight,
      });
      expect(drop.isNewTrack).toBe(true);
      expect(drop.trackIndex).toBe(index);
      expect(
        getDropLineY({
          dropTarget: drop,
          tracks: ordered,
          getExtraHeight: extraHeight,
        }),
      ).toBe(index === 1 ? 113 : 189);
    },
  );
});
