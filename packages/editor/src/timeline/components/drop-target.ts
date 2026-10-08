import { getOrderedTracks } from "@/timeline/track-order";
import type { TimelineTrack } from "@/timeline";
import type { ComputeDropTargetParams, DropTarget } from "@/timeline";
import { resolveTrackPlacement } from "@/timeline/placement";
import {
  TIMELINE_TRACK_GAP_PX,
  TIMELINE_CONTENT_TOP_PADDING_PX,
} from "./layout";
import { getTrackHeight, getCumulativeHeightBefore } from "./track-layout";
import {
  mediaTime,
  type MediaTime,
  roundMediaTime,
  TICKS_PER_SECOND,
} from "@/wasm";

function getTrackAtY({
  mouseY,
  tracks,
  verticalDragDirection,
  getExtraHeight,
}: {
  mouseY: number;
  tracks: TimelineTrack[];
  getExtraHeight?: (trackIndex: number) => number;
  verticalDragDirection?: "up" | "down" | null;
}): { trackIndex: number; relativeY: number } | null {
  let cumulativeHeight = 0;

  for (let i = 0; i < tracks.length; i++) {
    const trackHeight =
      getTrackHeight({ type: tracks[i].type }) + (getExtraHeight?.(i) ?? 0);
    const trackTop = cumulativeHeight;
    const trackBottom = trackTop + trackHeight;

    if (mouseY >= trackTop && mouseY < trackBottom) {
      return {
        trackIndex: i,
        relativeY: mouseY - trackTop,
      };
    }

    if (i < tracks.length - 1 && verticalDragDirection) {
      const gapTop = trackBottom;
      const gapBottom = gapTop + TIMELINE_TRACK_GAP_PX;
      if (mouseY >= gapTop && mouseY < gapBottom) {
        const isDraggingUp = verticalDragDirection === "up";
        return {
          trackIndex: isDraggingUp ? i : i + 1,
          relativeY: isDraggingUp ? trackHeight - 1 : 0,
        };
      }
    }

    cumulativeHeight += trackHeight + TIMELINE_TRACK_GAP_PX;
  }

  return null;
}

function fallbackNewTrackDropTarget({
  xPosition,
}: {
  xPosition: MediaTime;
}): DropTarget {
  return {
    trackIndex: 0,
    isNewTrack: true,
    insertPosition: null,
    xPosition,
  };
}

export function computeDropTarget({
  elementType,
  mouseX,
  mouseY,
  tracks,
  playheadTime,
  isExternalDrop,
  elementDuration,
  pixelsPerSecond,
  zoomLevel,
  verticalDragDirection,
  startTimeOverride,
  excludeElementId,
  getExtraHeight,
}: ComputeDropTargetParams): DropTarget {
  const orderedTracks = getOrderedTracks(tracks);
  const xPosition =
    startTimeOverride !== undefined
      ? startTimeOverride
      : isExternalDrop
        ? playheadTime
        : mediaTime({
            ticks: Math.round(
              Math.max(0, mouseX / (pixelsPerSecond * zoomLevel)) *
                TICKS_PER_SECOND,
            ),
          });

  if (orderedTracks.length === 0) {
    const placementResult = resolveTrackPlacement({
      tracks,
      elementType,
      timeSpans: [
        { startTime: xPosition, duration: elementDuration, excludeElementId },
      ],
      strategy: {
        type: "preferIndex",
        trackIndex: 0,
        hoverDirection: "below",
        createNewTrackOnly: true,
      },
    });
    const emptyTimelineResult =
      placementResult?.kind === "newTrack" ? placementResult : null;
    if (!emptyTimelineResult) {
      return fallbackNewTrackDropTarget({ xPosition });
    }

    return {
      trackIndex: emptyTimelineResult.insertIndex,
      isNewTrack: true,
      insertPosition: emptyTimelineResult.insertPosition,
      xPosition,
    };
  }

  const trackAtMouse = getTrackAtY({
    mouseY,
    tracks: orderedTracks,
    verticalDragDirection,
    getExtraHeight,
  });

  if (!trackAtMouse) {
    const isAboveAllTracks = mouseY < 0;

    const placementResult = resolveTrackPlacement({
      tracks,
      elementType,
      timeSpans: [
        { startTime: xPosition, duration: elementDuration, excludeElementId },
      ],
      strategy: {
        type: "preferIndex",
        trackIndex: isAboveAllTracks ? 0 : orderedTracks.length - 1,
        hoverDirection: isAboveAllTracks ? "above" : "below",
        createNewTrackOnly: true,
      },
    });
    const outOfBoundsResult =
      placementResult?.kind === "newTrack" ? placementResult : null;
    if (!outOfBoundsResult) {
      return fallbackNewTrackDropTarget({ xPosition });
    }

    return {
      trackIndex: outOfBoundsResult.insertIndex,
      isNewTrack: true,
      insertPosition: outOfBoundsResult.insertPosition,
      xPosition,
    };
  }

  const { trackIndex, relativeY } = trackAtMouse;
  const track = orderedTracks[trackIndex];

  const trackHeight =
    getTrackHeight({ type: track.type }) + (getExtraHeight?.(trackIndex) ?? 0);
  const placementResult = resolveTrackPlacement({
    tracks,
    elementType,
    timeSpans: [
      { startTime: xPosition, duration: elementDuration, excludeElementId },
    ],
    strategy: {
      type: "preferIndex",
      trackIndex,
      hoverDirection: relativeY < trackHeight / 2 ? "above" : "below",
      verticalDragDirection,
    },
  });
  if (!placementResult) {
    return fallbackNewTrackDropTarget({ xPosition });
  }

  if (placementResult.kind === "existingTrack") {
    const adjustedXPosition =
      placementResult.adjustedStartTime !== undefined
        ? roundMediaTime({ time: placementResult.adjustedStartTime })
        : xPosition;

    return {
      trackIndex: placementResult.trackIndex,
      isNewTrack: false,
      insertPosition: null,
      xPosition: adjustedXPosition,
    };
  }

  return {
    trackIndex: placementResult.insertIndex,
    isNewTrack: true,
    insertPosition: placementResult.insertPosition,
    xPosition,
  };
}

export function getDropLineY({
  dropTarget,
  tracks,
  getExtraHeight,
}: {
  dropTarget: DropTarget;
  tracks: TimelineTrack[];
  getExtraHeight?: (trackIndex: number) => number;
}): number {
  const trackIndex = Math.min(
    Math.max(dropTarget.trackIndex, 0),
    tracks.length,
  );
  return (
    TIMELINE_CONTENT_TOP_PADDING_PX +
    getCumulativeHeightBefore({ tracks, trackIndex, getExtraHeight })
  );
}
