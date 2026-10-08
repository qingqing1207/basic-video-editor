import { createBrowserRepositories } from "@basic-video-editor/editor";

/** Storage belongs to the host: the list page and the editor page use the same repositories. */
export const STORAGE_NAMESPACE =
  process.env.NEXT_PUBLIC_BVE_NAMESPACE ?? "basic-video-editor-next-v1";

let repositories: ReturnType<typeof createBrowserRepositories> | undefined;
export function getRepositories() {
  return (repositories ??= createBrowserRepositories({ namespace: STORAGE_NAMESPACE }));
}
