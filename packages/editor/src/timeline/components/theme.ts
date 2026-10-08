import type { TrackType } from "@/timeline";


export const TIMELINE_TRACK_THEME: Record<
  TrackType,
  {
    elementClassName: string;
  }
> = {
  video: { elementClassName: "bve-track-video" },
  text: { elementClassName: "bve-track-text" },
  audio: {
    elementClassName: "bve-track-audio",
  },
} as const;

export const SELECTED_TRACK_ROW_CLASS = "bg-accent/50";
export const DEFAULT_TIMELINE_BOOKMARK_COLOR = "#009dff";

export function getTimelineElementClassName({
  type,
}: {
  type: TrackType;
}): string {
  return TIMELINE_TRACK_THEME[type].elementClassName.trim();
}
