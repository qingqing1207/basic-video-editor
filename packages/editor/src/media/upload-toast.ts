import { toast } from "@/core/notify";
import { EditorCore } from "@/core";

export interface MediaUploadToastResult {
  uploadedCount: number;
  assetNames?: string[];
}

function getAssetLabel({ count }: { count: number }): string {
  return count === 1 ? "media asset" : "media assets";
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function showMediaUploadToast<T extends MediaUploadToastResult>({
  filesCount,
  promise,
}: {
  filesCount: number;
  promise: Promise<T> | (() => Promise<T>);
}) {
  const editor = EditorCore.getInstance();
  const generation = editor.mediaGeneration;
  const run = typeof promise === "function" ? promise : () => promise;
  const toastPromise = toast.promise(
    async () => {
      await waitForNextPaint();
      if (editor.destroyed || generation !== editor.mediaGeneration) {
        throw new DOMException("Import cancelled", "AbortError");
      }
      return run();
    },
    {
      loading: `Uploading ${getAssetLabel({ count: filesCount })}...`,
      success: ({ uploadedCount, assetNames }) => {
        if (uploadedCount === 1) {
          const assetName = assetNames?.[0];
          return assetName
            ? `${assetName} has been uploaded`
            : "1 media asset has been uploaded";
        }

        if (uploadedCount > 1) {
          return `${uploadedCount} media assets have been uploaded`;
        }

        return "No media assets were uploaded";
      },
      error: `Failed to upload ${getAssetLabel({ count: filesCount })}`,
    },
  );

  // Project close must also await the pre-paint delay and the asset insertion,
  // not only the media decoding task nested inside the callback.
  return editor.trackTask(toastPromise.unwrap());
}
