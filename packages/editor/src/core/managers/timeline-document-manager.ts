import type { EditorCore } from "@/core";
import type { Bookmark, TimelineTracks, TimelineData } from "@/timeline";
import {
  getBookmarkAtTime,
  getFrameTime,
  isBookmarkAtTime,
} from "@/timeline/bookmarks";
import {
  MoveBookmarkCommand,
  RemoveBookmarkCommand,
  ToggleBookmarkCommand,
  UpdateBookmarkCommand,
} from "@/commands/bookmark";
import type { MediaTime } from "@/wasm";

/** The single editable timeline belonging to the open project. */
export class TimelineDocumentManager {
  private active: TimelineData | null = null;
  private listeners = new Set<() => void>();
  constructor(private editor: EditorCore) {}

  initialize(timeline: TimelineData): void {
    this.active = timeline;
    this.notify();
  }
  clear(): void {
    this.active = null;
    this.notify();
  }
  getTimeline(): TimelineData {
    if (!this.active) throw new Error("No open project timeline");
    return this.active;
  }
  getTimelineOrNull(): TimelineData | null {
    return this.active;
  }

  private update(timeline: TimelineData): void {
    this.active = timeline;
    const project = this.editor.project.getActiveOrNull();
    if (project)
      this.editor.project.setActiveProject({
        project: {
          ...project,
          timeline,
          metadata: { ...project.metadata, updatedAt: new Date() },
        },
      });
    this.notify();
  }
  updateTracks({ tracks }: { tracks: TimelineTracks }): void {
    if (this.active) this.update({ ...this.active, tracks });
  }
  setBookmarks(bookmarks: Bookmark[]): void {
    if (this.active) this.update({ ...this.active, bookmarks });
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
  async toggleBookmark({ time }: { time: MediaTime }): Promise<void> {
    const command = new ToggleBookmarkCommand(time);
    this.editor.command.execute({ command });
  }

  isBookmarked({ time }: { time: MediaTime }): boolean {
    const activeTimeline = this.getTimeline();
    const activeProject = this.editor.project.getActive();

    if (!activeTimeline || !this.active || !activeProject) return false;

    const frameTime = getFrameTime({
      time,
      fps: activeProject.settings.fps,
    });

    return isBookmarkAtTime({ bookmarks: activeTimeline.bookmarks, frameTime });
  }

  async removeBookmark({ time }: { time: MediaTime }): Promise<void> {
    const command = new RemoveBookmarkCommand(time);
    this.editor.command.execute({ command });
  }

  async updateBookmark({
    time,
    updates,
  }: {
    time: MediaTime;
    updates: Partial<Omit<Bookmark, "time">>;
  }): Promise<void> {
    const command = new UpdateBookmarkCommand({ time, updates });
    this.editor.command.execute({ command });
  }

  async moveBookmark({
    fromTime,
    toTime,
  }: {
    fromTime: MediaTime;
    toTime: MediaTime;
  }): Promise<void> {
    const command = new MoveBookmarkCommand({ fromTime, toTime });
    this.editor.command.execute({ command });
  }

  getBookmarkAtTime({ time }: { time: MediaTime }) {
    const activeTimeline = this.active;
    const activeProject = this.editor.project.getActive();

    if (!activeTimeline || !activeProject) return null;

    const frameTime = getFrameTime({
      time,
      fps: activeProject.settings.fps,
    });

    return getBookmarkAtTime({
      bookmarks: activeTimeline.bookmarks,
      frameTime,
    });
  }
}
