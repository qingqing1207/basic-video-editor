import type {
  SerializedProject,
  MediaAssetData,
} from "@/services/storage/types";
import type {
  TranscriptionProgress,
  TranscriptionResult,
} from "@/transcription/types";
import type { FontOption } from "@/fonts/types";
/** What the editor needs to open and save the current project. */
export interface ProjectRepository {
  read(id: string): Promise<SerializedProject | null>;
  save(project: SerializedProject): Promise<void>;
}
/** Repository plus the catalog operations a host needs for its own project list. The editor never calls these. */
export interface ProjectStore extends ProjectRepository {
  list(): Promise<SerializedProject[]>;
  delete(id: string): Promise<void>;
}
export interface StoredAsset {
  metadata: MediaAssetData;
  file: File;
}
export interface AssetRepository {
  list(projectId: string): Promise<MediaAssetData[]>;
  read(projectId: string, id: string): Promise<StoredAsset | null>;
  save(projectId: string, asset: StoredAsset): Promise<void>;
  delete(projectId: string, id: string): Promise<void>;
}
/** Repository plus removal of a whole project's media, for host-side project deletion. The editor never calls it. */
export interface AssetStore extends AssetRepository {
  deleteProject(projectId: string): Promise<void>;
}
export interface FontProvider {
  list(): Promise<FontOption[]>;
  load(family: string): Promise<FontFace[] | void>;
}
export interface TranscriptionProvider {
  transcribe(input: {
    audioData: Float32Array;
    sampleRate: number;
    language?: string;
    signal: AbortSignal;
    onProgress?: (progress: TranscriptionProgress) => void;
  }): Promise<TranscriptionResult>;
}
export interface EditorOptions {
  projects?: ProjectRepository;
  assets?: AssetRepository;
  fonts?: FontProvider;
  transcription?: TranscriptionProvider;
  storageNamespace?: string;
}
