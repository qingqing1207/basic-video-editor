import { Command, type CommandResult } from "@/commands/base-command";
import { EditorCore } from "@/core";
import type { Bookmark } from "@/timeline";
import {
  getFrameTime,
  updateBookmarkInArray,
} from "@/timeline/bookmarks/index";
import type { MediaTime } from "@/wasm";

export class UpdateBookmarkCommand extends Command {
  private savedBookmarks: Bookmark[] | null = null;

  constructor({
    time,
    updates,
  }: {
    time: MediaTime;
    updates: Partial<Omit<Bookmark, "time">>;
  }) {
    super();
    this.time = time;
    this.updates = updates;
  }

  private time: MediaTime;
  private updates: Partial<Omit<Bookmark, "time">>;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const activeTimeline = editor.document.getTimeline();
    const activeProject = editor.project.getActive();

    if (!activeTimeline || !activeProject) {
      return;
    }

    this.savedBookmarks = [...activeTimeline.bookmarks];

    const frameTime = getFrameTime({
      time: this.time,
      fps: activeProject.settings.fps,
    });

    const updatedBookmarks = updateBookmarkInArray({
      bookmarks: activeTimeline.bookmarks,
      frameTime,
      updates: this.updates,
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
