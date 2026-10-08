import { PlaybackManager } from "./managers/playback-manager";
import { TimelineManager } from "./managers/timeline-manager";
import { TimelineDocumentManager } from "./managers/timeline-document-manager";
import { ProjectManager } from "./managers/project-manager";
import { MediaManager } from "./managers/media-manager";
import { RendererManager } from "./managers/renderer-manager";
import { CommandManager } from "./managers/commands";
import { SaveManager } from "./managers/save-manager";
import { AudioManager } from "./managers/audio-manager";
import { SelectionManager } from "./managers/selection-manager";
import { ClipboardManager } from "./managers/clipboard-manager";
import { DiagnosticsManager } from "./managers/diagnostics-manager";
import { registerDefaultMasks } from "@/masks";
import { registerTranscriptionDiagnostics } from "@/transcription/diagnostics";
import { type EditorOptions } from "@/api/adapters";
import { createBrowserRepositories } from "@/browser/repositories";
import { StorageService } from "@/services/storage/service";
import { Notifications } from "./notifications";
import { FontService } from "@/fonts/service";
import { TranscriptionService } from "./transcription";
import { clearImageSourceCache } from "@/services/renderer/nodes/image-node";
import { wasmCompositor } from "@/services/renderer/compositor/wasm-compositor";
import { disposeGpuRenderer } from "@/services/renderer/gpu-renderer";
import { blurPreviewService } from "@/services/renderer/blur/preview";
import { getExportMimeType, type ExportOptions } from "@/export";
import { processMediaAssets } from "@/media/processing";

export class EditorCore {
  private static instance: EditorCore | null = null;
  public readonly timeline: TimelineManager;
  public readonly command: CommandManager;
  public readonly playback: PlaybackManager;
  public readonly document: TimelineDocumentManager;
  public readonly project: ProjectManager;
  public readonly media: MediaManager;
  public readonly renderer: RendererManager;
  public readonly save: SaveManager;
  public readonly audio: AudioManager;
  public readonly selection: SelectionManager;
  public readonly clipboard: ClipboardManager;
  public readonly diagnostics: DiagnosticsManager;

  private constructor(options: EditorOptions) {
    this.options = options;
    this.fonts = new FontService(options.fonts, this.notifications);
    this.transcription = new TranscriptionService(options.transcription);
    const defaults = createBrowserRepositories({
      namespace: options.storageNamespace,
    });
    this.storage = new StorageService(
      options.projects ?? defaults.projects,
      options.assets ?? defaults.assets,
      (task) => this.trackTask(task),
    );
    registerDefaultMasks();
    this.command = new CommandManager(this);
    this.timeline = new TimelineManager(this);
    this.playback = new PlaybackManager(this);
    this.document = new TimelineDocumentManager(this);
    this.project = new ProjectManager(this);
    this.media = new MediaManager(this);
    this.renderer = new RendererManager(this);
    this.save = new SaveManager({ editor: this });
    this.audio = new AudioManager(this);
    this.selection = new SelectionManager(this);
    this.clipboard = new ClipboardManager(this);
    this.diagnostics = new DiagnosticsManager(this);
    registerTranscriptionDiagnostics({ diagnostics: this.diagnostics });
    this.playback.bindTimelineScope();
    this.save.start();
  }

  static getActiveInstance() {
    return EditorCore.instance;
  }
  static getInstance(): EditorCore {
    if (!EditorCore.instance)
      throw new Error("No active editor. Call createEditor() first.");
    return EditorCore.instance;
  }

  public readonly storage: StorageService;
  public readonly notifications = new Notifications();
  public readonly options: EditorOptions;

  static create(options: EditorOptions = {}): EditorCore {
    if (EditorCore.instance)
      throw new Error(
        "Only one active editor is supported. Destroy the existing instance first.",
      );
    const instance = new EditorCore(options);
    EditorCore.instance = instance;
    return instance;
  }

  readonly fonts: FontService;
  readonly transcription: TranscriptionService;
  destroyed = false;
  private destroyPromise: Promise<void> | null = null;
  private viewRoot: HTMLElement | null = null;
  attachView(root: HTMLElement) {
    if (this.destroyed) throw new Error("Cannot mount a destroyed editor");
    if (this.viewRoot && this.viewRoot !== root)
      throw new Error("Only one mounted VideoEditor is supported");
    this.viewRoot = root;
    this.activeRoots.add(root);
    return () => {
      if (this.viewRoot === root) this.viewRoot = null;
      this.timeline.dragSource.end();
      // An interrupted scrub/transform is transient, not a committed edit.
      if (!this.destroyed) this.timeline.discardPreview();
      if (!this.destroyed)
        this.project.setTimelineViewState({
          viewState: {
            ...this.project.getTimelineViewState(),
            playheadTime: this.playback.getCurrentTime(),
          },
        });
      this.activeRoots.delete(root);
    };
  }
  activeRoots = new Set<HTMLElement>();
  mediaGeneration = 0;
  private pendingTasks = new Set<Promise<unknown>>();
  trackTask<T>(task: Promise<T>): Promise<T> {
    this.pendingTasks.add(task);
    void task.finally(() => this.pendingTasks.delete(task)).catch(() => {});
    return task;
  }
  private operations: Promise<unknown> = Promise.resolve();

  ownsEvent(event: Event) {
    return [...this.activeRoots].some(
      (root) =>
        event.composedPath().includes(root) ||
        root.contains(event.target as Node),
    );
  }

  private enqueue<T>(run: () => Promise<T>): Promise<T> {
    if (this.destroyed || this.destroyPromise)
      return Promise.reject(new Error("Editor is destroyed"));
    const operation = this.operations.then(run);
    this.operations = operation.catch(() => {});
    return operation;
  }

  private stopActivities() {
    this.mediaGeneration++;
    this.timeline.dragSource.end();
    this.playback.pause();
    this.project.cancelExport();
    this.transcription.cancel();
  }

  newProject(name: string = "Untitled project") {
    this.stopActivities();
    return this.enqueue(async () => {
      await this.closeCurrent(false);
      const id = await this.project.createNewProject({ name });
      this.save.reset();
      return id;
    });
  }

  openProject(id: string) {
    this.stopActivities();
    return this.enqueue(async () => {
      await this.closeCurrent(false);
      await this.project.loadProject({ id });
      this.save.reset();
    });
  }

  saveProject() {
    return this.enqueue(async () => {
      this.save.markDirty({ force: true });
      await this.save.flush();
    });
  }

  closeProject(options: { discard?: boolean } = {}) {
    this.stopActivities();
    return this.enqueue(() => this.closeCurrent(options.discard ?? false));
  }

  private async closeCurrent(discard: boolean) {
    this.playback.pause();
    this.project.cancelExport();
    this.transcription.cancel();
    await this.waitForExport();
    await Promise.allSettled([...this.pendingTasks]);
    if (!discard) await this.save.flush();
    else await this.save.settle();
    this.save.pause();
    this.project.closeProject();
    this.command.clear();
    this.clipboard.clear();
    this.selection.clearSelection();
    this.renderer.setRenderTree({ renderTree: null });
    clearImageSourceCache();
    wasmCompositor.clear();
    this.save.reset();
    this.save.resume();
  }

  private waitForExport(): Promise<void> {
    if (!this.project.getExportState().isExporting) return Promise.resolve();
    return new Promise((resolve) => {
      const unsubscribe = this.project.subscribe(() => {
        if (!this.project.getExportState().isExporting) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  importMedia(files: File[]) {
    return this.enqueue(async () => {
      const projectId = this.project.getActive()?.metadata.id;
      if (!projectId) throw new Error("Open a project first");
      const processed = await processMediaAssets({ files });
      return Promise.all(
        processed.map((asset) =>
          this.media.addMediaAsset({ projectId, asset }),
        ),
      );
    });
  }

  export(options: ExportOptions, signal?: AbortSignal) {
    const generation = this.mediaGeneration;
    return this.enqueue(async () => {
      if (generation !== this.mediaGeneration)
        throw new DOMException("Export cancelled", "AbortError");
      signal?.throwIfAborted();
      const cancel = () => this.project.cancelExport();
      signal?.addEventListener("abort", cancel, { once: true });
      try {
        const result = await this.project.export({ options });
        if (result.cancelled)
          throw new DOMException("Export cancelled", "AbortError");
        if (!result.success || !result.buffer)
          throw new Error(result.error || "Export failed");
        return new Blob([result.buffer], {
          type: getExportMimeType({ format: options.format }),
        });
      } finally {
        signal?.removeEventListener("abort", cancel);
      }
    });
  }

  subscribe(listener: () => void) {
    const stops = [
      this.project.subscribe(listener),
      this.timeline.subscribe(listener),
      this.document.subscribe(listener),
      this.media.subscribe(listener),
      this.playback.subscribe(listener),
    ];
    return () => stops.forEach((stop) => stop());
  }

  destroy(options: { discard?: boolean } = {}) {
    if (this.destroyed) return Promise.resolve();
    if (this.destroyPromise) return this.destroyPromise;
    this.stopActivities();
    const operation = this.enqueue(async () => {
      await this.closeCurrent(options.discard ?? false);
      this.save.stop();
      this.audio.dispose();
      this.playback.dispose();
      this.fonts.destroy();
      blurPreviewService.clear();
      disposeGpuRenderer();
      this.notifications.clear();
      this.activeRoots.clear();
      this.destroyed = true;
      EditorCore.instance = null;
    });
    this.destroyPromise = operation.catch((error) => {
      this.destroyPromise = null;
      throw error;
    });
    return this.destroyPromise;
  }
}
