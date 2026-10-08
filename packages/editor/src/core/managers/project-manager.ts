import type { EditorCore } from "@/core";
import type {
  TProject,
  TProjectSettings,
  TTimelineViewState,
} from "@/project/types";
import type { ExportOptions, ExportResult, ExportState } from "@/export";

import { toast } from "@/core/notify";
import { UpdateProjectSettingsCommand } from "@/commands/project";
import { buildNewProject } from "@/project/record";
import { calculateTotalDuration } from "@/timeline";
import { buildScene } from "@/services/renderer/scene-builder";
import { CanvasRenderer } from "@/services/renderer/canvas-renderer";
import { loadFonts } from "@/fonts/local-fonts";
import { DEFAULTS } from "@/timeline/defaults";
import { getElementFontFamilies } from "@/timeline/element-utils";
import { getRaisedProjectFpsForImportedMedia } from "@/fps/utils";
import type { MediaAsset } from "@/media/types";

export class ProjectManager {
  private active: TProject | null = null;
  private listeners = new Set<() => void>();
  private exportState: ExportState = {
    isExporting: false,
    progress: 0,
    result: null,
  };
  private exportCancelRequested = false;

  constructor(private editor: EditorCore) {}

  async createNewProject({ name }: { name: string }): Promise<string> {
    const newProject = buildNewProject({ name });

    this.active = newProject;
    this.notify();

    this.editor.media.clearAllAssets();
    this.editor.document.initialize(newProject.timeline);

    try {
      await this.editor.storage.saveProject({ project: newProject });

      return newProject.metadata.id;
    } catch (error) {
      toast.error("Failed to save new project");
      throw error;
    }
  }

  async loadProject({ id }: { id: string }): Promise<void> {
    this.editor.save.pause();
    this.editor.media.clearAllAssets();
    this.editor.document.clear();

    try {
      const result = await this.editor.storage.loadProject({ id });
      if (!result) {
        throw new Error(`Project with id ${id} not found`);
      }

      const project = result.project;

      this.active = project;
      this.notify();

      this.editor.document.initialize(project.timeline);

      await this.editor.media.loadProjectMedia({ projectId: id });

      await loadFonts({
        families: [
          ...new Set(
            getElementFontFamilies({ tracks: project.timeline.tracks }),
          ),
        ],
      });

      if (!project.metadata.thumbnail) {
        try {
          const didUpdateThumbnail = await this.updateThumbnailFromTimeline();
          if (didUpdateThumbnail) {
            await this.saveCurrentProject({ capturePlayhead: false });
          }
        } catch (error) {
          console.error("Failed to generate project thumbnail:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      throw error;
    } finally {
      this.notify();
      this.editor.save.resume();
    }
  }

  async saveCurrentProject({
    capturePlayhead = true,
  }: { capturePlayhead?: boolean } = {}): Promise<void> {
    if (!this.active) return;

    try {
      const timeline = this.editor.document.getTimeline();
      const updatedProject = {
        ...this.active,
        // Loading can generate a thumbnail before the view restores playback.
        // Keep the saved playhead during that metadata-only write.
        timelineViewState: {
          ...this.getTimelineViewState(),
          ...(capturePlayhead && {
            playheadTime: this.editor.playback.getCurrentTime(),
          }),
        },
        timeline,
        metadata: {
          ...this.active.metadata,
          duration: calculateTotalDuration({ tracks: timeline.tracks }),
          updatedAt: new Date(),
        },
      };

      await this.editor.storage.saveProject({ project: updatedProject });
      this.active = updatedProject;
      this.notify();
    } catch (error) {
      console.error("Failed to save project:", error);
      throw error;
    }
  }

  async export({ options }: { options: ExportOptions }): Promise<ExportResult> {
    if (this.exportState.isExporting)
      throw new Error("An export is already in progress");
    this.exportCancelRequested = false;
    this.exportState = { isExporting: true, progress: 0, result: null };
    this.notify();

    let result: ExportResult;
    try {
      result = await this.editor.renderer.exportProject({
        options,
        onProgress: ({ progress }) => {
          this.exportState = { ...this.exportState, progress };
          this.notify();
        },
        onCancel: () => this.exportCancelRequested,
      });
    } catch (error) {
      this.exportState = { ...this.exportState, isExporting: false };
      this.notify();
      throw error;
    }

    this.exportState = {
      isExporting: false,
      progress: this.exportState.progress,
      result,
    };
    this.notify();

    return result;
  }

  cancelExport(): void {
    this.exportCancelRequested = true;
  }

  clearExportState(): void {
    if (this.exportState.isExporting) {
      this.cancelExport();
      return;
    }
    this.exportState = { isExporting: false, progress: 0, result: null };
    this.notify();
  }

  getExportState(): ExportState {
    return this.exportState;
  }

  closeProject(): void {
    this.active = null;
    this.notify();

    this.editor.media.clearAllAssets();
    this.editor.document.clear();
  }

  /** Renames the open project. The change is saved by the normal autosave. */
  renameActiveProject({ name }: { name: string }): void {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Project name cannot be empty");
    if (!this.active) throw new Error("No active project");
    this.active = {
      ...this.active,
      metadata: { ...this.active.metadata, name: trimmed, updatedAt: new Date() },
    };
    this.notify();
    this.editor.save.markDirty();
  }

  async updateSettings({
    settings,
    pushHistory = true,
  }: {
    settings: Partial<TProjectSettings>;
    pushHistory?: boolean;
  }): Promise<void> {
    if (!this.active) return;

    const command = new UpdateProjectSettingsCommand(settings);
    if (pushHistory) {
      this.editor.command.execute({ command });
      return;
    }

    command.execute();
  }

  ratchetFpsForImportedMedia({
    importedAssets,
  }: {
    importedAssets: Array<Pick<MediaAsset, "type" | "fps">>;
  }): import("@basic-video-editor/render-wasm").FrameRate | null {
    if (!this.active) return null;

    const nextFps = getRaisedProjectFpsForImportedMedia({
      currentFps: this.active.settings.fps,
      importedAssets,
    });
    if (nextFps === null) return null;

    new UpdateProjectSettingsCommand({ fps: nextFps }).execute();
    return nextFps;
  }

  async updateThumbnail({ thumbnail }: { thumbnail: string }): Promise<void> {
    if (!this.active) return;

    const updatedProject: TProject = {
      ...this.active,
      metadata: { ...this.active.metadata, thumbnail, updatedAt: new Date() },
    };
    this.active = updatedProject;
    this.notify();
    this.editor.save.markDirty();
  }

  async prepareExit(): Promise<void> {
    if (!this.active) return;

    try {
      const didUpdateThumbnail = await this.updateThumbnailFromTimeline();
      if (didUpdateThumbnail) {
        await this.editor.save.flush();
      }
    } catch (error) {
      console.error("Failed to generate project thumbnail on exit:", error);
    }
  }

  getActive(): TProject {
    if (!this.active) {
      throw new Error("No active project");
    }
    return this.active;
  }

  /**
   * for agents:
   * in most cases, the project is guaranteed to be active, in which getActive() should be used instead.
   * for very rare cases, this function may be used.
   */
  getActiveOrNull(): TProject | null {
    return this.active;
  }

  getTimelineViewState(): TTimelineViewState {
    return this.active?.timelineViewState ?? DEFAULTS.timeline.viewState;
  }

  setTimelineViewState({ viewState }: { viewState: TTimelineViewState }): void {
    if (!this.active) return;
    this.active = {
      ...this.active,
      timelineViewState: viewState ?? undefined,
    };
    this.editor.save.markDirty();
    this.notify();
  }

  setActiveProject({ project }: { project: TProject }): void {
    this.active = project;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async updateThumbnailFromTimeline(): Promise<boolean> {
    if (!this.active) return false;

    const tracks = this.editor.document.getTimeline().tracks;
    const mediaAssets = this.editor.media.getAssets();
    const duration = this.editor.timeline.getTotalDuration();
    const { canvasSize, background } = this.active.settings;

    const scene = buildScene({
      tracks,
      mediaAssets,
      duration: duration || 1,
      canvasSize,
      background,
    });

    const renderer = new CanvasRenderer({
      width: canvasSize.width,
      height: canvasSize.height,
      fps: this.active.settings.fps,
    });

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;

    await renderer.renderToCanvas({
      node: scene,
      time: 0,
      targetCanvas: tempCanvas,
    });

    const thumbnailDataUrl = tempCanvas.toDataURL("image/png");

    await this.updateThumbnail({ thumbnail: thumbnailDataUrl });
    return true;
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }
}
