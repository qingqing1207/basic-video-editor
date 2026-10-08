import { describe, expect, test, vi } from "vitest";
import {
  ZoomController,
  type ZoomConfig,
} from "@/timeline/controllers/zoom-controller";
import { ZERO_MEDIA_TIME } from "@/wasm";

function controller(initialZoom = 2) {
  const config: ZoomConfig = {
    minZoom: 0.25,
    getContainerEl: () => null,
    getTracksScrollEl: () => null,
    getRulerScrollEl: () => null,
    getCurrentPlayheadTime: () => ZERO_MEDIA_TIME,
    seek: vi.fn(),
    setTimelineViewState: vi.fn(),
  };
  return new ZoomController({ configRef: { current: config }, initialZoom });
}

describe("timeline zoom invalid-state recovery", () => {
  test("invalid control values cannot disable subsequent button or wheel zoom", () => {
    const zoom = controller();
    const listener = vi.fn();
    zoom.subscribe(listener);
    zoom.setZoomLevel(Number.NaN);
    zoom.setZoomLevel(Number.POSITIVE_INFINITY);
    expect(zoom.zoomLevel).toBe(2);
    expect(listener).not.toHaveBeenCalled();
    zoom.setZoomLevel((previous) => previous * 1.25);
    expect(zoom.zoomLevel).toBe(2.5);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY])(
    "reopening an invalid saved zoom %s falls back to the valid minimum",
    (savedZoom) => {
      const zoom = controller(savedZoom);
      expect(zoom.zoomLevel).toBe(0.25);
      zoom.setZoomLevel((previous) => previous * 2);
      expect(zoom.zoomLevel).toBe(0.5);
    },
  );
});
