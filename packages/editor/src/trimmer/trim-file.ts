import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSink,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
} from "mediabunny";
import { TrimCanceledError } from "./errors";
import { sampleTimes } from "./trim-math";

export interface TrimVideoInfo {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface TrimResult {
  /** The trimmed video, a new file. */
  file: File;
  /** Selection in the source, in seconds. */
  start: number;
  end: number;
  duration: number;
}

function createInput(file: Blob) {
  return new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
}

/** Reads duration and size; throws when the file has no decodable video. */
export async function readTrimVideoInfo(file: Blob): Promise<TrimVideoInfo> {
  const input = createInput(file);
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error("This file has no video track.");
    if (!(await track.canDecode()))
      throw new Error("This browser can't decode this video.");
    const duration = await input.computeDuration();
    const width = track.displayWidth;
    const height = track.displayHeight;
    return { duration, width, height, aspectRatio: width / height };
  } finally {
    input.dispose();
  }
}

/**
 * Draws evenly spaced frames, left to right, via `draw`. Stops quietly when `signal` aborts.
 * `frameWidth` is the decoded width in device pixels.
 */
export async function extractFilmstrip({
  file,
  count,
  duration,
  frameWidth,
  signal,
  draw,
}: {
  file: Blob;
  count: number;
  duration: number;
  frameWidth: number;
  signal: AbortSignal;
  draw: (frame: CanvasImageSource, index: number) => void;
}): Promise<void> {
  const input = createInput(file);
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track || signal.aborted) return;
    const sink = new CanvasSink(track, {
      width: Math.max(16, Math.round(frameWidth)),
      fit: "cover",
    });
    const times = sampleTimes({ duration, count });
    let index = 0;
    for await (const wrapped of sink.canvasesAtTimestamps(times)) {
      if (signal.aborted) return;
      if (wrapped) draw(wrapped.canvas, index);
      index += 1;
    }
  } finally {
    input.dispose();
  }
}

function outputNames(file: Blob, mime: string, sourceName: string) {
  const webm = mime.includes("webm") || mime.includes("matroska");
  const extension = webm ? "webm" : "mp4";
  const base = sourceName.replace(/\.[^./\\]+$/, "") || "video";
  return {
    format: webm ? new WebMOutputFormat() : new Mp4OutputFormat(),
    type: webm ? "video/webm" : "video/mp4",
    name: `${base}-trimmed.${extension}`,
  };
}

/**
 * Cuts `[start, end]` out of `file` entirely in the browser and returns a new file.
 * Keeps the source container when it is mp4/mov or webm/mkv, otherwise writes mp4.
 */
export async function trimVideoFile({
  file,
  start,
  end,
  onProgress,
  signal,
}: {
  file: File;
  start: number;
  end: number;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<TrimResult> {
  if (!(end > start)) throw new Error("The end must be after the start.");
  if (signal?.aborted) throw new TrimCanceledError();

  const input = createInput(file);
  try {
    const target = new BufferTarget();
    const names = outputNames(file, await input.getMimeType(), file.name);
    const output = new Output({ format: names.format, target });
    const conversion = await Conversion.init({
      input,
      output,
      trim: { start, end },
      showWarnings: false,
    });
    if (!conversion.isValid)
      throw new Error("This video can't be trimmed in the browser.");

    conversion.onProgress = (value) => onProgress?.(Math.min(1, value));
    const onAbort = () => void conversion.cancel();
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      await conversion.execute();
    } catch (error) {
      if (signal?.aborted) throw new TrimCanceledError();
      throw error;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }

    const buffer = target.buffer;
    if (!buffer) throw new Error("Trimming produced no data.");
    onProgress?.(1);
    return {
      file: new File([buffer], names.name, { type: names.type }),
      start,
      end,
      duration: end - start,
    };
  } finally {
    input.dispose();
  }
}
