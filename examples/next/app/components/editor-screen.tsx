"use client";
import dynamic from "next/dynamic";
import { Loading } from "./loading";

const EditorView = dynamic(() => import("./editor-view"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function EditorScreen({ projectId }: { projectId: string }) {
  return <EditorView projectId={projectId} />;
}
