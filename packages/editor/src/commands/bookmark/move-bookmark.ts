import { Command, type CommandResult } from "@/commands/base-command";
import { EditorCore } from "@/core";
import type { Bookmark } from "@/timeline";
import { getFrameTime, moveBookmarkInArray } from "@/timeline/bookmarks/index";
import type { MediaTime } from "@/wasm";

export class MoveBookmarkCommand extends Command {
  private savedBookmarks: Bookmark[] | null = null;

  constructor({
    fromTime,
    toTime,
  }: {
    fromTime: MediaTime;
    toTime: MediaTime;
  }) {
    super();
    this.fromTime = fromTime;
    this.toTime = toTime;
  }

  private fromTime: MediaTime;
  private toTime: MediaTime;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const activeTimeline = editor.document.getTimeline();
    const activeProject = editor.project.getActive();

    if (!activeTimeline || !activeProject) {
      return;
    }

    this.savedBookmarks = [...activeTimeline.bookmarks];

    const fromFrameTime = getFrameTime({
      time: this.fromTime,
      fps: activeProject.settings.fps,
    });
    const toFrameTime = getFrameTime({
      time: this.toTime,
      fps: activeProject.settings.fps,
    });

    const updatedBookmarks = moveBookmarkInArray({
      bookmarks: activeTimeline.bookmarks,
      fromTime: fromFrameTime,
      toTime: toFrameTime,
    });

    editor.document.setBookmarks(updatedBookmarks);
  }

  undo(): void {
    if (this.savedBookmarks) {
      const editor = EditorCore.getInstance();
      editor.document.setBookmarks(this.savedBookmarks);
    }
  }
}
