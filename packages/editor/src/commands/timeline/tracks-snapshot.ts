import { Command, type CommandResult } from "@/commands/base-command";
import type { TimelineTracks } from "@/timeline";
import { EditorCore } from "@/core";

export class TracksSnapshotCommand extends Command {
  constructor({
    before,
    after,
  }: {
    before: TimelineTracks;
    after: TimelineTracks;
  }) {
    super();
    this.before = before;
    this.after = after;
  }

  private before: TimelineTracks;
  private after: TimelineTracks;

  execute(): CommandResult | undefined {
    EditorCore.getInstance().timeline.updateTracks(this.after);
    return undefined;
  }

  undo(): void {
    EditorCore.getInstance().timeline.updateTracks(this.before);
  }
}
