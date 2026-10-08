import EditorScreen from "../../components/editor-screen";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorScreen projectId={decodeURIComponent(id)} />;
}
