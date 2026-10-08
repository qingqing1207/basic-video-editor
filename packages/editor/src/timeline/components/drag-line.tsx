import { getDropLineY } from "./drop-target";
import type { TimelineTrack, DropTarget } from "@/timeline";
import { TIMELINE_LAYERS } from "./layers";

interface DragLineProps {
  dropTarget: DropTarget | null;
  tracks: TimelineTrack[];
  isVisible: boolean;
  getExtraHeight?: (trackIndex: number) => number;
}

export function DragLine({
  dropTarget,
  tracks,
  isVisible,
  getExtraHeight,
}: DragLineProps) {
  if (!isVisible || !dropTarget?.isNewTrack) return null;

  // Shares the tracks' scroll/positioning parent, including clipping.
  const lineTop = getDropLineY({ dropTarget, tracks, getExtraHeight });

  return (
    <div
      data-testid="timeline-drop-indicator"
      data-drop-index={dropTarget.trackIndex}
      className="bve-drop-indicator pointer-events-none absolute right-0 left-0"
      style={{ top: `${lineTop}px`, zIndex: TIMELINE_LAYERS.dragLine }}
    />
  );
}
