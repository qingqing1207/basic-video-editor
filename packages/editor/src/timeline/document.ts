import type { TimelineData } from "./types";
import { generateUUID } from "@/utils/id";
import { MAIN_TRACK_NAME } from "./placement/main-track";

export function buildDefaultTimeline(): TimelineData {
  return {
    tracks: {
      overlay: [],
      main: {
        id: generateUUID(),
        name: MAIN_TRACK_NAME,
        type: "video",
        elements: [],
        muted: false,
        hidden: false,
      },
      audio: [],
    },
    bookmarks: [],
  };
}
