import { Command, type CommandResult } from "@/commands/base-command";
import { EditorCore } from "@/core";
import { buildEmptyTrack } from "@/timeline/placement";
import { removeTrackById } from "@/timeline/track-order";
import { generateUUID } from "@/utils/id";
import type { TimelineTracks } from "@/timeline";

export class RemoveTrackCommand extends Command {
  private fallback = buildEmptyTrack({ id: generateUUID(), type: "video" });
  private savedState: TimelineTracks | null = null;

  constructor(private trackId: string) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.document.getTimeline().tracks;
    editor.timeline.updateTracks(
      removeTrackById(this.savedState, this.trackId, this.fallback),
    );
    const selection = editor.selection.getSnapshot();
    return {
      selection: {
        selectedElements: selection.selectedElements.filter(
          (ref) => ref.trackId !== this.trackId,
        ),
        selectedKeyframes: selection.selectedKeyframes.filter(
          (ref) => ref.trackId !== this.trackId,
        ),
        keyframeSelectionAnchor:
          selection.keyframeSelectionAnchor?.trackId === this.trackId
            ? null
            : selection.keyframeSelectionAnchor,
        selectedMaskPoints:
          selection.selectedMaskPoints?.trackId === this.trackId
            ? null
            : selection.selectedMaskPoints,
      },
    };
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
