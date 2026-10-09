import { create } from "zustand";
import { getMediaTypeFromFile } from "@/media/media-utils";

interface ImportTrimRequest {
  files: File[];
  resolve: (files: File[] | null) => void;
}

interface ImportTrimState {
  /** Whether imports with videos open the trim dialog. Set by the editor view. */
  enabled: boolean;
  /** The dialog is mounted and can answer a request. */
  hasDialog: boolean;
  request: ImportTrimRequest | null;
}

export const useImportTrimStore = create<ImportTrimState>(() => ({
  enabled: true,
  hasDialog: false,
  request: null,
}));

/**
 * Lets the user trim the videos in `files` before they are imported.
 * Resolves with the files to import (trimmed ones replaced), or `null` when the user cancels.
 * Resolves with `files` untouched when there is no video, the option is off, or no dialog is mounted.
 */
export function requestImportTrim({
  files,
}: {
  files: File[];
}): Promise<File[] | null> {
  const { enabled, hasDialog, request } = useImportTrimStore.getState();
  const hasVideo = files.some(
    (file) => getMediaTypeFromFile({ file }) === "video",
  );
  if (!enabled || !hasDialog || !hasVideo) return Promise.resolve(files);
  // A second import while the dialog is open replaces nothing: it waits its turn.
  if (request) request.resolve(null);
  return new Promise((resolve) => {
    useImportTrimStore.setState({ request: { files, resolve } });
  });
}
