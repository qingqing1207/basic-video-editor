import { insertTrackAtIndex } from "@/timeline/track-order";
import { Command, type CommandResult } from "@/commands/base-command";
import type { TimelineTracks, TrackType } from "@/timeline";
import { generateUUID } from "@/utils/id";
import { EditorCore } from "@/core";
import {
  buildEmptyTrack,
  getDefaultInsertIndexForTrack,
} from "@/timeline/placement";

export class AddTrackCommand extends Command {
  private trackId: string;
  private savedState: TimelineTracks | null = null;

  constructor({ type, index }: { type: TrackType; index?: number }) {
    super();
    this.type = type;
    this.index = index;
    this.trackId = generateUUID();
  }

  private type: TrackType;
  private index?: number;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.document.getTimeline().tracks;

    const insertIndex =
      this.index ??
      getDefaultInsertIndexForTrack({
        tracks: this.savedState,
        trackType: this.type,
      });

    const updatedTracks = insertTrackAtIndex(
      this.savedState,
      buildEmptyTrack({ id: this.trackId, type: this.type }),
      insertIndex,
    );

    editor.timeline.updateTracks(updatedTracks);
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }

  getTrackId(): string {
    return this.trackId;
  }
}
