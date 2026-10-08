import type { TProject } from "@/project/types";
import type { MediaAsset } from "@/media/types";
import type { MediaAssetData } from "./types";
import { deserializeProject, serializeProject } from "./serialization";
import type { ProjectRepository, AssetRepository } from "@/api/adapters";
import {
  evaluateStorageCapacity,
  isStorageQuotaExceededError,
  readStorageQuotaStatus,
} from "./quota";
export { CURRENT_PROJECT_VERSION } from "./serialization";
export class StorageService {
  constructor(
    private projects: ProjectRepository,
    private assets: AssetRepository,
    private track: <T>(task: Promise<T>) => Promise<T> = (task) => task,
  ) {}
  async canStoreFile({ size }: { size: number }) {
    return evaluateStorageCapacity({
      requiredBytes: size,
      quotaStatus: await readStorageQuotaStatus(),
    });
  }
  isQuotaExceededError({ error }: { error: unknown }) {
    return isStorageQuotaExceededError({ error });
  }
  async saveProject({ project }: { project: TProject }) {
    await this.track(this.projects.save(serializeProject(project)));
  }
  async loadProject({ id }: { id: string }) {
    const data = await this.projects.read(id);
    return data ? { project: deserializeProject(data) } : null;
  }
  async saveMediaAsset({
    projectId,
    mediaAsset: a,
  }: {
    projectId: string;
    mediaAsset: MediaAsset;
  }) {
    const metadata: MediaAssetData = {
      id: a.id,
      name: a.name,
      type: a.type,
      size: a.file.size,
      lastModified: a.file.lastModified,
      mimeType: a.file.type,
      width: a.width,
      height: a.height,
      duration: a.duration,
      fps: a.fps,
      hasAudio: a.hasAudio,
      ephemeral: a.ephemeral,
      thumbnailUrl: a.thumbnailUrl?.startsWith("data:")
        ? a.thumbnailUrl
        : undefined,
    };
    await this.track(this.assets.save(projectId, { metadata, file: a.file }));
  }
  async loadMediaAsset({
    projectId,
    id,
  }: {
    projectId: string;
    id: string;
  }): Promise<MediaAsset | null> {
    const stored = await this.assets.read(projectId, id);
    if (!stored) return null;
    return {
      ...stored.metadata,
      file: stored.file,
      url: URL.createObjectURL(stored.file),
    };
  }
  async loadAllMediaAssets({ projectId }: { projectId: string }) {
    const entries = await this.assets.list(projectId);
    const loaded: MediaAsset[] = [];
    try {
      for (const entry of entries) {
        const asset = await this.loadMediaAsset({ projectId, id: entry.id });
        if (!asset)
          throw new Error(`Missing media: ${entry.name} (${entry.id})`);
        loaded.push(asset);
      }
    } catch (error) {
      for (const item of loaded) if (item.url) URL.revokeObjectURL(item.url);
      throw error;
    }
    return loaded;
  }
  deleteMediaAsset({ projectId, id }: { projectId: string; id: string }) {
    return this.track(this.assets.delete(projectId, id));
  }
}
