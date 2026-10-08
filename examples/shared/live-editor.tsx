"use client";
import { useEffect, useMemo, useState } from "react";
import {
  createBrowserRepositories,
  createProjectRecord,
  ProjectEditor,
  type EditorAppearance,
  type EditorDensity,
} from "@basic-video-editor/editor";
import { downloadExport } from "./download-export";

const NAMESPACE = "basic-video-editor-lab-v1";
const PROJECT_ID = "theme-lab";

function Loading() {
  return (
    <div role="status" aria-label="Loading" style={{ display: "flex", height: "100%", minHeight: 240, alignItems: "center", justifyContent: "center" }}>
      <style>{"@keyframes bve-lab-spin{to{transform:rotate(360deg)}}"}</style>
      <svg viewBox="0 0 24 24" width={32} height={32} fill="none" style={{ animation: "bve-lab-spin 0.8s linear infinite" }} aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** A real editor on one scratch project, used by the theme lab. No project list: that is a host concern. */
export default function LiveEditor(props: {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  density: EditorDensity;
  appearance?: EditorAppearance;
  height: string;
}) {
  const repositories = useMemo(() => createBrowserRepositories({ namespace: NAMESPACE }), []);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!(await repositories.projects.read(PROJECT_ID))) {
        const record = await createProjectRecord({ name: "Theme lab" });
        await repositories.projects.save({ ...record, metadata: { ...record.metadata, id: PROJECT_ID } });
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [repositories]);
  if (!ready) return <Loading />;
  return <Session {...props} />;
}

function Session({
  height,
  theme,
  onThemeChange,
  density,
  appearance,
}: Parameters<typeof LiveEditor>[0]) {
  return (
    <div style={{ height }}>
      <ProjectEditor
        projectId={PROJECT_ID}
        storageNamespace={NAMESPACE}
        theme={theme}
        onThemeChange={onThemeChange}
        density={density}
        appearance={appearance}
        fallback={<Loading />}
        onExport={downloadExport}
      />
    </div>
  );
}
