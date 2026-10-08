"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectEditor } from "@basic-video-editor/editor";
import { downloadExport } from "../../../shared/download-export";
import { STORAGE_NAMESPACE } from "../lib/repositories";
import { Loading } from "./loading";

/**
 * The editor page. The host owns the route and the downloads; ProjectEditor owns the editor session
 * (create, open the project, autosave, destroy on leave).
 */
export default function EditorView({ projectId }: { projectId: string }) {
  const router = useRouter();
  return (
    <div style={{ height: "100dvh" }}>
      <ProjectEditor
        projectId={projectId}
        storageNamespace={STORAGE_NAMESPACE}
        defaultTheme="light"
        fallback={<Loading />}
        renderError={(error) => (
          <div role="alert" className="flex h-full flex-col items-start gap-4 p-8">
            <p>{error.message}</p>
            <Link href="/" className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100">
              Back to projects
            </Link>
          </div>
        )}
        onExit={() => router.push("/")}
        onExport={downloadExport}
      />
    </div>
  );
}
