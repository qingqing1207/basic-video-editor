import type { EditorCore } from "@/core";
import { toast } from "@/core/notify";
import type { MediaAsset } from "@/media/types";

import { generateUUID } from "@/utils/id";
import { videoCache } from "@/services/video-cache/service";
import { waveformCache } from "@/services/waveform-cache/service";
import { BatchCommand, RemoveMediaAssetCommand } from "@/commands";

export class MediaManager {
  private assets: MediaAsset[] = [];
  private retainedUrls = new Set<string>();
  private retainUrls(assets: MediaAsset[]) {
    for (const asset of assets) {
      if (asset.url?.startsWith("blob:")) this.retainedUrls.add(asset.url);
      if (asset.thumbnailUrl?.startsWith("blob:"))
        this.retainedUrls.add(asset.thumbnailUrl);
    }
  }
  private isLoading = false;
  private listeners = new Set<() => void>();

  constructor(private editor: EditorCore) {}

  async addMediaAsset({
    projectId,
    asset,
  }: {
    projectId: string;
    asset: Omit<MediaAsset, "id">;
  }): Promise<MediaAsset | null> {
    if (
      this.editor.destroyed ||
      this.editor.project.getActiveOrNull()?.metadata.id !== projectId
    ) {
      if (asset.url) URL.revokeObjectURL(asset.url);
      return null;
    }
    const newAsset: MediaAsset = {
      ...asset,
      id: generateUUID(),
    };

    this.retainUrls([newAsset]);
    this.assets = [...this.assets, newAsset];
    this.notify();

    try {
      await this.editor.storage.saveMediaAsset({
        projectId,
        mediaAsset: newAsset,
      });
      if (
        this.editor.destroyed ||
        this.editor.project.getActiveOrNull()?.metadata.id !== projectId
      )
        return null;
      this.editor.project.ratchetFpsForImportedMedia({
        importedAssets: [newAsset],
      });
      return newAsset;
    } catch (error) {
      console.error("Failed to save media asset:", error);
      this.assets = this.assets.filter((asset) => asset.id !== newAsset.id);
      this.notify();

      if (newAsset.url) URL.revokeObjectURL(newAsset.url);
      if (this.editor.storage.isQuotaExceededError({ error })) {
        toast.error("Not enough browser storage", {
          description: error instanceof Error ? error.message : undefined,
        });
      } else
        this.editor.notifications.emit({
          type: "error",
          title: "Unable to save imported media",
          description: error instanceof Error ? error.message : String(error),
        });
      return null;
    }
  }

  removeMediaAsset({ projectId, id }: { projectId: string; id: string }): void {
    this.removeMediaAssets({ projectId, ids: [id] });
  }

  removeMediaAssets({
    projectId,
    ids,
  }: {
    projectId: string;
    ids: string[];
  }): void {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return;
    }

    const command =
      uniqueIds.length === 1
        ? new RemoveMediaAssetCommand({
            projectId,
            assetId: uniqueIds[0],
          })
        : new BatchCommand(
            uniqueIds.map(
              (id) =>
                new RemoveMediaAssetCommand({
                  projectId,
                  assetId: id,
                }),
            ),
          );

    this.editor.command.execute({ command });
  }

  async loadProjectMedia({ projectId }: { projectId: string }): Promise<void> {
    this.isLoading = true;
    this.notify();

    try {
      const mediaAssets = await this.editor.storage.loadAllMediaAssets({
        projectId,
      });
      this.retainUrls(mediaAssets);
      this.assets = mediaAssets;
      this.notify();
    } catch (error) {
      console.error("Failed to load media assets:", error);
      this.editor.notifications.emit({
        type: "error",
        title: "Unable to restore media",
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  async clearProjectMedia({ projectId }: { projectId: string }): Promise<void> {
    waveformCache.clearAll();

    this.assets.forEach((asset) => {
      if (asset.url) {
        URL.revokeObjectURL(asset.url);
      }
      if (asset.thumbnailUrl) {
        URL.revokeObjectURL(asset.thumbnailUrl);
      }
    });

    const mediaIds = this.assets.map((asset) => asset.id);
    this.assets = [];
    this.notify();

    try {
      await Promise.all(
        mediaIds.map((id) =>
          this.editor.storage.deleteMediaAsset({ projectId, id }),
        ),
      );
    } catch (error) {
      console.error("Failed to clear media assets from storage:", error);
    }
  }

  clearAllAssets(): void {
    for (const url of this.retainedUrls) URL.revokeObjectURL(url);
    this.retainedUrls.clear();
    videoCache.clearAll();
    waveformCache.clearAll();

    this.assets.forEach((asset) => {
      if (asset.url) {
        URL.revokeObjectURL(asset.url);
      }
      if (asset.thumbnailUrl) {
        URL.revokeObjectURL(asset.thumbnailUrl);
      }
    });

    this.assets = [];
    this.notify();
  }

  getAssets(): MediaAsset[] {
    return this.assets;
  }

  setAssets({ assets }: { assets: MediaAsset[] }): void {
    this.retainUrls(assets);
    this.assets = assets;
    this.notify();
  }

  isLoadingMedia(): boolean {
    return this.isLoading;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }
}
