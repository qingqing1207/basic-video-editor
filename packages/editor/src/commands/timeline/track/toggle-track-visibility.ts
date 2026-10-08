import { Command, type CommandResult } from "@/commands/base-command";
import type { TimelineTracks } from "@/timeline";
import { EditorCore } from "@/core";
import {
  canTrackBeHidden,
  findTrackInTimelineTracks,
  updateTrackInTimelineTracks,
} from "@/timeline";

export class ToggleTrackVisibilityCommand extends Command {
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
      update: (track) => {
        if (canTrackBeHidden(track)) {
          return { ...track, hidden: !track.hidden };
        }
        return track;
      },
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
