"use client";
import {
  lazy,
  Suspense,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import type { ProjectEditorProps, ProjectEditorHandle, EditorInstance } from "@/index";
import { createEditor } from "@/create-editor";
import { createSerialQueue } from "./serial-queue";

/**
 * Loaded only after the editor exists: evaluating the editor modules touches the WASM time core,
 * which createEditor() initializes first.
 */
const VideoEditorView = lazy(() => import("./video-editor"));

/** One queue for the whole page: only one editor can exist at a time. */
const enqueue = createSerialQueue();

function DefaultError({ error, onExit }: { error: Error; onExit?: () => void | Promise<void> }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <p style={{ margin: 0 }}>{error.message}</p>
      {onExit && (
        <button type="button" onClick={() => void onExit()}>
          Back
        </button>
      )}
    </div>
  );
}

const toError = (value: unknown) => (value instanceof Error ? value : new Error(String(value)));

/**
 * Opens one project in an editor it creates, and tears everything down on unmount.
 * Storage is the browser's IndexedDB/OPFS under `storageNamespace`; a host project list that uses
 * `createBrowserRepositories({ namespace })` with the same namespace sees the same projects.
 */
export default function ProjectEditorView({
  projectId,
  storageNamespace,
  repositories,
  fonts,
  transcription,
  fallback,
  renderError,
  onReady,
  onSaved,
  onDirtyChange,
  onError,
  ref,
  ...viewProps
}: ProjectEditorProps & { ref?: Ref<ProjectEditorHandle> }) {
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Latest callbacks and creation options, read without re-running the effects.
  const latest = useRef({ repositories, fonts, transcription, onReady, onSaved, onDirtyChange, onError });
  latest.current = { repositories, fonts, transcription, onReady, onSaved, onDirtyChange, onError };

  useImperativeHandle(ref, () => ({ editor }), [editor]);

  const fail = (cause: unknown) => {
    const failure = toError(cause);
    setError(failure);
    latest.current.onError?.(failure);
  };

  // Create the editor once per storage namespace; destroy it (saving first) on unmount.
  useEffect(() => {
    let cancelled = false;
    let instance: EditorInstance | null = null;
    setEditor(null);
    setOpenId(null);
    setError(null);
    const created = enqueue(async () => {
      if (cancelled) return;
      const options = latest.current;
      instance = await createEditor({
        projects: options.repositories?.projects,
        assets: options.repositories?.assets,
        fonts: options.fonts,
        transcription: options.transcription,
        storageNamespace,
      });
      if (cancelled) return;
      setEditor(instance);
      latest.current.onReady?.(instance);
    }).catch((cause) => {
      if (!cancelled) fail(cause);
    });
    return () => {
      cancelled = true;
      void enqueue(async () => {
        await created;
        if (instance) await instance.destroy().catch(console.error);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageNamespace]);

  // Open (or switch to) the requested project on the same editor instance.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    setError(null);
    void editor
      .openProject(projectId)
      .then(() => {
        if (!cancelled) setOpenId(projectId);
      })
      .catch((cause) => {
        if (!cancelled) fail(cause);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, projectId]);

  // Autosave status for the host.
  useEffect(() => {
    if (!editor) return;
    return editor.save.subscribe((event) => {
      const callbacks = latest.current;
      if (event.type === "saved") callbacks.onSaved?.({ projectId: event.projectId });
      else if (event.type === "dirty") callbacks.onDirtyChange?.(event.dirty);
      else callbacks.onError?.(event.error);
    });
  }, [editor]);

  const loading: ReactNode = fallback;
  if (error)
    return renderError ? <>{renderError(error)}</> : <DefaultError error={error} onExit={viewProps.onExit} />;
  if (!editor || openId !== projectId) return <LoadingSlot fallback={loading} />;
  return (
    <Suspense fallback={<LoadingSlot fallback={loading} />}>
      <VideoEditorView editor={editor} {...viewProps} />
    </Suspense>
  );
}

function LoadingSlot({ fallback }: { fallback: ReactNode }) {
  return <>{fallback ?? <DefaultLoading />}</>;
}

function DefaultLoading() {
  return (
    <div
      role="status"
      aria-label="Loading project"
      style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
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
