import type {
  TimelineTrack,
  VideoTrack,
  AudioTrack,
  TextTrack,
} from "@/timeline";

export function canTrackHaveAudio(
  track: TimelineTrack,
): track is VideoTrack | AudioTrack {
  return track.type === "audio" || track.type === "video";
}

export function canTrackBeHidden(
  track: TimelineTrack,
): track is VideoTrack | TextTrack {
  return track.type !== "audio";
}
