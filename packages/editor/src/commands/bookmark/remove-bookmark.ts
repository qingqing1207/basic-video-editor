import { Command, type CommandResult } from "@/commands/base-command";
import { EditorCore } from "@/core";
import type { Bookmark } from "@/timeline";
import {
  getFrameTime,
  removeBookmarkFromArray,
} from "@/timeline/bookmarks/index";
import { type MediaTime, ZERO_MEDIA_TIME } from "@/wasm";

export class RemoveBookmarkCommand extends Command {
  private savedBookmarks: Bookmark[] | null = null;
  private frameTime: MediaTime = ZERO_MEDIA_TIME;

  constructor(private time: MediaTime) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const activeTimeline = editor.document.getTimeline();
    const activeProject = editor.project.getActive();

    if (!activeTimeline || !activeProject) {
      return;
    }

    this.savedBookmarks = [...activeTimeline.bookmarks];

    this.frameTime = getFrameTime({
      time: this.time,
      fps: activeProject.settings.fps,
    });

    const updatedBookmarks = removeBookmarkFromArray({
      bookmarks: activeTimeline.bookmarks,
      frameTime: this.frameTime,
    });

    if (updatedBookmarks.length === activeTimeline.bookmarks.length) {
      return;
    }

    editor.document.setBookmarks(updatedBookmarks);
  }

  undo(): void {
    if (this.savedBookmarks) {
      const editor = EditorCore.getInstance();
      editor.document.setBookmarks(this.savedBookmarks);
    }
  }
}
