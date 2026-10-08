"use client";
import "./react/style.css";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import type { EditorCore } from "./core";
import type {
  AssetRepository,
  EditorOptions,
  FontProvider,
  ProjectRepository,
  TranscriptionProvider,
} from "./api/adapters";
export type {
  EditorOptions,
  ProjectRepository,
  ProjectStore,
  AssetRepository,
  AssetStore,
  StoredAsset,
  FontProvider,
  TranscriptionProvider,
} from "./api/adapters";
export type { FontOption } from "./fonts/types";
export type {
  SerializedProject,
  SerializedProjectMetadata,
  MediaAssetData,
} from "./services/storage/types";

export type { ExportOptions } from "./export";
export type EditorInstance = EditorCore;
export { createBrowserRepositories } from "./browser/repositories";
import type { EditorAppearance, EditorDensity } from "./theme/tokens";
export type {
  EditorAppearance,
  EditorDensity,
  EditorThemeTokens,
  EditorThemeMode,
  EditorTokenName,
} from "./theme/tokens";
export { editorTokenDefinitions, editorTokenGroups } from "./theme/tokens";
export interface VideoEditorProps {
  editor: EditorInstance;
  className?: string;
  style?: CSSProperties;
  theme?: "light" | "dark";
  appearance?: EditorAppearance;
  density?: EditorDensity;
  defaultTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  portalContainer?: HTMLElement | null;
  topBar?: ReactNode;
  onExport?: (result: { blob: Blob; filename: string }) => void | Promise<void>;
  onExit?: () => void | Promise<void>;
  /** Shown while the editor code loads. Defaults to a centered spinner. */
  fallback?: ReactNode;
}
export { createEditor } from "./create-editor";
export interface ProjectEditorProps extends Omit<VideoEditorProps, "editor"> {
  /** The project to open. Changing it switches projects on the same editor. */
  projectId: string;
  /** Storage namespace (IndexedDB / OPFS / preferences). Use the same value for your project list. */
  storageNamespace?: string;
  /** Advanced: replaces the default browser storage. Browser IndexedDB is the supported default. */
  repositories?: { projects: ProjectRepository; assets: AssetRepository };
  fonts?: FontProvider;
  transcription?: TranscriptionProvider;
  /** Replaces the default error screen (missing project, storage failure). */
  renderError?: (error: Error) => ReactNode;
  /** Called once the editor instance exists. The component owns it: do not destroy it yourself. */
  onReady?: (editor: EditorInstance) => void;
  /** Autosave finished. */
  onSaved?: (event: { projectId: string }) => void;
  /** There are (true) or are no longer (false) unsaved changes. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Creating the editor, opening the project, or autosave failed. */
  onError?: (error: Error) => void;
}
export interface ProjectEditorHandle {
  editor: EditorInstance | null;
}
/**
 * A new empty project, ready for `ProjectRepository.save()` and a later `editor.openProject(id)`.
 * Needs no editor instance. It loads the WASM time core on first use, so importing the package stays cheap.
 */
export async function createProjectRecord({
  name,
}: {
  name: string;
}): Promise<import("./services/storage/types").SerializedProject> {
  if (typeof window === "undefined")
    throw new Error("createProjectRecord must run in a browser");
  const { initializeWasm } = await import("@basic-video-editor/render-wasm");
  await initializeWasm();
  const { createProjectRecord: create } = await import("./project/record");
  return create({ name });
}
const EditorView = lazy(() => import("./react/video-editor"));
const ProjectEditorView = lazy(() => import("./react/project-editor"));
function EditorLoading() {
  return (
    <div
      role="status"
      aria-label="Loading editor"
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 24 24" width={32} height={32} fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}
/** The server renders a placeholder without evaluating the browser editor graph. */
export function VideoEditor({ fallback, ...props }: VideoEditorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loading = fallback ?? <EditorLoading />;
  return mounted ? (
    <Suspense fallback={loading}>
      <EditorView {...props} />
    </Suspense>
  ) : (
    <div data-editor-placeholder="" style={{ width: "100%", height: "100%" }}>
      {loading}
    </div>
  );
}
/**
 * Opens one project and manages the whole editor session: creates the editor, opens the project,
 * saves and destroys on unmount. Browser storage only (IndexedDB + OPFS).
 */
export function ProjectEditor({
  ref,
  ...props
}: ProjectEditorProps & { ref?: Ref<ProjectEditorHandle> }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loading = props.fallback ?? <EditorLoading />;
  return mounted ? (
    <Suspense fallback={loading}>
      <ProjectEditorView ref={ref} {...props} />
    </Suspense>
  ) : (
    <div data-editor-placeholder="" style={{ width: "100%", height: "100%" }}>
      {loading}
    </div>
  );
}
export type { MediaTime } from "./wasm/media-time";
export type {
  CreateTimelineElement,
  TimelineElement,
  TimelineTracks,
} from "./timeline/types";
export { detectCapabilities } from "./browser/capabilities";
