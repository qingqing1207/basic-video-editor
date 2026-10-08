import { Command, type CommandResult } from "@/commands/base-command";
import { EditorCore } from "@/core";
import type { Bookmark } from "@/timeline";
import {
  getFrameTime,
  toggleBookmarkInArray,
} from "@/timeline/bookmarks/index";
import { type MediaTime, ZERO_MEDIA_TIME } from "@/wasm";

export class ToggleBookmarkCommand extends Command {
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

    const updatedBookmarks = toggleBookmarkInArray({
      bookmarks: activeTimeline.bookmarks,
      frameTime: this.frameTime,
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
