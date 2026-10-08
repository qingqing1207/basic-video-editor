import type { TranscriptionProvider } from "@/api/adapters";
import type { TranscriptionProgress } from "@/transcription/types";
export class TranscriptionService {
  private controller: AbortController | null = null;
  constructor(private provider?: TranscriptionProvider) {}
  get configured() {
    return Boolean(this.provider);
  }
  cancel() {
    this.controller?.abort();
  }
  async transcribe(input: {
    audioData: Float32Array | (() => Promise<Float32Array>);
    language?: string;
    onProgress?: (progress: TranscriptionProgress) => void;
  }) {
    if (!this.provider)
      throw new Error("Transcription provider is not configured");
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    try {
      const audioData =
        typeof input.audioData === "function"
          ? await input.audioData()
          : input.audioData;
      controller.signal.throwIfAborted();
      const result = await this.provider.transcribe({
        ...input,
        audioData,
        sampleRate: 16000,
        signal: controller.signal,
        onProgress: (progress) => {
          if (!controller.signal.aborted) input.onProgress?.(progress);
        },
      });
      controller.signal.throwIfAborted();
      return result;
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }
}
