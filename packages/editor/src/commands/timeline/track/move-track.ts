import { Command } from "@/commands/base-command";
import { EditorCore } from "@/core";
import type { TimelineTracks } from "@/timeline";
import { moveTrackToIndex } from "@/timeline/track-order";

export class MoveTrackCommand extends Command {
  private savedState: TimelineTracks | null = null;
  constructor(
    private trackId: string,
    private index: number,
  ) {
    super();
  }
  execute(): undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.document.getTimeline().tracks;
    editor.timeline.updateTracks(
      moveTrackToIndex(this.savedState, this.trackId, this.index),
    );
  }
  undo(): void {
    if (this.savedState)
      EditorCore.getInstance().timeline.updateTracks(this.savedState);
  }
}
