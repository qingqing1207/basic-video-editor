import { EditorCore } from "@/core";
import { Command, type CommandResult } from "@/commands/base-command";
import type { TimelineTracks, TimelineElement } from "@/timeline";
import {
  findTrackInTimelineTracks,
  updateElementInTimelineTracks,
} from "@/timeline";
import { applyElementUpdate } from "@/timeline/update-pipeline";

export class UpdateElementsCommand extends Command {
  private savedState: TimelineTracks | null = null;
  private readonly updates: Array<{
    trackId: string;
    elementId: string;
    patch: Partial<TimelineElement>;
  }>;

  constructor({
    updates,
  }: {
    updates: Array<{
      trackId: string;
      elementId: string;
      patch: Partial<TimelineElement>;
    }>;
  }) {
    super();
    this.updates = updates;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.document.getTimeline().tracks;
    let updatedTracks = this.savedState;

    for (const updateEntry of this.updates) {
      const currentTrack = findTrackInTimelineTracks({
        tracks: updatedTracks,
        trackId: updateEntry.trackId,
      });
      const currentElement = currentTrack?.elements.find(
        (element) => element.id === updateEntry.elementId,
      );
      if (!currentTrack || !currentElement) {
        continue;
      }

      const nextElement = applyElementUpdate({
        element: currentElement,
        patch: updateEntry.patch,
        context: {
          tracks: updatedTracks,
          trackId: updateEntry.trackId,
        },
      });

      updatedTracks = updateElementInTimelineTracks({
        tracks: updatedTracks,
        trackId: updateEntry.trackId,
        elementId: updateEntry.elementId,
        update: () => nextElement,
      });
    }

    editor.timeline.updateTracks(updatedTracks);
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
