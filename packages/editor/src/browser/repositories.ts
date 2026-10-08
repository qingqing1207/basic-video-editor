import type { ProjectStore, AssetStore, StoredAsset } from "@/api/adapters";
import type {
  SerializedProject,
  MediaAssetData,
} from "@/services/storage/types";
import { IndexedDBAdapter } from "@/services/storage/indexeddb-adapter";
import { OPFSAdapter } from "@/services/storage/opfs-adapter";
export function createBrowserRepositories({
  namespace = "basic-video-editor-v1",
}: { namespace?: string } = {}): {
  projects: ProjectStore;
  assets: AssetStore;
} {
  if (!/^[a-zA-Z0-9_-]+$/.test(namespace))
    throw new Error("Invalid storage namespace");
  const projects = new IndexedDBAdapter<SerializedProject>({
    dbName: `${namespace}-projects`,
    storeName: "projects",
  });
  const files = (id: string) => new OPFSAdapter(`${namespace}-assets-${id}`);
  const metadata = (id: string) =>
    new IndexedDBAdapter<MediaAssetData>({
      dbName: `${namespace}-assets-${id}`,
      storeName: "assets",
    });
  return {
    projects: {
      list: () => projects.getAll(),
      read: (id) => projects.get(id),
      save: (value) => projects.set({ key: value.metadata.id, value }),
      delete: (id) => projects.remove(id),
    },
    assets: {
      list: (id) => metadata(id).getAll(),
      async read(projectId, id) {
        const [info, file] = await Promise.all([
          metadata(projectId).get(id),
          files(projectId).get(id),
        ]);
        return info && file
          ? {
              metadata: info,
              file: new File([file], info.name, {
                type: info.mimeType || file.type,
                lastModified: info.lastModified,
              }),
            }
          : null;
      },
      async save(projectId, { metadata: info, file }: StoredAsset) {
        if (!OPFSAdapter.isSupported())
          throw new Error(
            "OPFS is unavailable. Use a supported desktop browser or supply an AssetRepository.",
          );
        const previous = await files(projectId).get(info.id);
        try {
          await files(projectId).set({ key: info.id, value: file });
          await metadata(projectId).set({ key: info.id, value: info });
        } catch (error) {
          try{if (previous) await files(projectId).set({ key: info.id, value: previous });else await files(projectId).remove(info.id);}catch(rollback){throw new AggregateError([error,rollback],"Media save and rollback failed");}
          throw error;
        }
      },
      async delete(projectId, id) {
        await files(projectId).remove(id);
        await metadata(projectId).remove(id);
      },
      async deleteProject(id) {
        await files(id).clear();
        await metadata(id).clear();
      },
    },
  };
}
