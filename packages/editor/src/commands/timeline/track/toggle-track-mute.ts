import { Command, type CommandResult } from "@/commands/base-command";
import type { TimelineTracks } from "@/timeline";
import { EditorCore } from "@/core";
import {
  canTrackHaveAudio,
  findTrackInTimelineTracks,
  updateTrackInTimelineTracks,
} from "@/timeline";

export class ToggleTrackMuteCommand extends Command {
  private savedState: TimelineTracks | null = null;

  constructor(private trackId: string) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.document.getTimeline().tracks;

    const targetTrack = findTrackInTimelineTracks({
      tracks: this.savedState,
      trackId: this.trackId,
    });
    if (!targetTrack) {
      return;
    }

    const updatedTracks = updateTrackInTimelineTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      update: (track) =>
        canTrackHaveAudio(track) ? { ...track, muted: !track.muted } : track,
    });

    editor.timeline.updateTracks(updatedTracks);
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
