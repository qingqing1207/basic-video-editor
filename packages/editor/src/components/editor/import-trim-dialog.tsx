"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/core/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMediaTypeFromFile } from "@/media/media-utils";
import { useImportTrimStore } from "@/media/import-trim";
import { useEditorUI } from "@/react/ui-context";
import VideoTrimmerView from "@/trimmer/video-trimmer-view";
import { TrimCanceledError } from "@/trimmer/errors";
import {
  extractFilmstrip,
  readTrimVideoInfo,
  trimVideoFile,
} from "@/trimmer/trim-file";
import { cn } from "@/utils/ui";
import type { VideoTrimmerHandle } from "@/index";

/** Selections closer than this to the whole video count as untouched. */
const UNTOUCHED_EPSILON = 0.05;

interface FileRange {
  start: number;
  end: number;
  duration: number;
}

function isModified(range: FileRange | undefined): range is FileRange {
  return (
    !!range &&
    (range.start > UNTOUCHED_EPSILON ||
      range.end < range.duration - UNTOUCHED_EPSILON)
  );
}

/** Opens when an import contains videos; resolves the pending import request. */
export function ImportTrimDialog() {
  const request = useImportTrimStore((state) => state.request);

  useEffect(() => {
    useImportTrimStore.setState({ hasDialog: true });
    return () => {
      useImportTrimStore.getState().request?.resolve(null);
      useImportTrimStore.setState({ hasDialog: false, request: null });
    };
  }, []);

  return request ? (
    <ImportTrimSession
      key={request.files.map((f) => f.name).join("|")}
      request={request}
    />
  ) : null;
}

function ImportTrimSession({
  request,
}: {
  request: NonNullable<
    ReturnType<typeof useImportTrimStore.getState>["request"]
  >;
}) {
  const { files } = request;
  const { theme, appearance, density } = useEditorUI();

  const videoIndexes = useMemo(
    () =>
      files.flatMap((file, index) =>
        getMediaTypeFromFile({ file }) === "video" ? [index] : [],
      ),
    [files],
  );
  const otherCount = files.length - videoIndexes.length;

  const [active, setActive] = useState(0);
  const [ranges, setRanges] = useState<Record<number, FileRange>>({});
  const [broken, setBroken] = useState<ReadonlySet<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ index: 0, total: 0, value: 0 });
  const trimmer = useRef<VideoTrimmerHandle>(null);
  const abort = useRef<AbortController | null>(null);

  const currentIndex = videoIndexes[active];
  const currentFile = files[currentIndex];
  const modifiedIndexes = videoIndexes.filter((index) =>
    isModified(ranges[index]),
  );

  const finish = (result: File[] | null) => {
    request.resolve(result);
    useImportTrimStore.setState({ request: null });
  };

  const cancel = () => {
    abort.current?.abort();
    finish(null);
  };

  const confirm = async () => {
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    const output = [...files];
    try {
      for (let step = 0; step < modifiedIndexes.length; step += 1) {
        const index = modifiedIndexes[step];
        const range = ranges[index];
        setProgress({ index: step, total: modifiedIndexes.length, value: 0 });
        try {
          const result = await trimVideoFile({
            file: files[index],
            start: range.start,
            end: range.end,
            signal: controller.signal,
            onProgress: (value) =>
              setProgress({
                index: step,
                total: modifiedIndexes.length,
                value,
              }),
          });
          output[index] = result.file;
        } catch (error) {
          if (error instanceof TrimCanceledError) return;
          toast.error(`Could not trim ${files[index].name}`, {
            description: error instanceof Error ? error.message : undefined,
          });
          setActive(videoIndexes.indexOf(index));
          setBusy(false);
          return;
        }
      }
      finish(output);
    } finally {
      abort.current = null;
    }
  };

  const importLabel = busy
    ? progress.total > 1
      ? `Trimming ${progress.index + 1}/${progress.total} · ${Math.round(progress.value * 100)}%`
      : `Trimming ${Math.round(progress.value * 100)}%`
    : files.length > 1
      ? `Import all (${files.length})`
      : "Import";

  return (
    <Dialog open onOpenChange={(open) => !open && cancel()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {videoIndexes.length > 1 ? "Trim videos" : "Trim video"}
          </DialogTitle>
          <DialogDescription>
            Choose the part to keep. Videos you leave alone are imported as they
            are.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          {broken.has(currentIndex) ? (
            <p className="text-muted-foreground flex min-h-40 items-center justify-center text-center text-sm">
              This video can&apos;t be previewed here. It will be imported as it
              is.
            </p>
          ) : (
            <VideoTrimmerView
              key={currentIndex}
              ref={trimmer}
              file={currentFile}
              defaultRange={
                ranges[currentIndex]
                  ? {
                      start: ranges[currentIndex].start,
                      end: ranges[currentIndex].end,
                    }
                  : undefined
              }
              onRangeChange={(range, info) =>
                setRanges((previous) => ({
                  ...previous,
                  [currentIndex]: { ...range, duration: info.duration },
                }))
              }
              onError={() =>
                setBroken((previous) => new Set(previous).add(currentIndex))
              }
              bare
              previewMaxHeight={260}
              theme={theme}
              appearance={appearance}
              density={density}
            />
          )}

          {videoIndexes.length > 1 && (
            <div
              role="tablist"
              aria-label="Videos"
              className="scrollbar-hidden -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
            >
              {videoIndexes.map((index, position) => (
                <VideoTile
                  key={index}
                  file={files[index]}
                  selected={position === active}
                  range={ranges[index]}
                  disabled={busy}
                  onSelect={() => setActive(position)}
                />
              ))}
            </div>
          )}

          {otherCount > 0 && (
            <p className="text-muted-foreground text-xs">
              {otherCount === 1
                ? "1 other file is imported as it is."
                : `${otherCount} other files are imported as they are.`}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            className="sm:mr-auto"
            disabled={busy || !isModified(ranges[currentIndex])}
            onClick={() => trimmer.current?.reset()}
          >
            Reset
          </Button>
          <Button variant="outline" onClick={cancel}>
            Cancel
          </Button>
          <Button
            onClick={() => void confirm()}
            disabled={busy}
            className="min-w-32"
          >
            {importLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoTile({
  file,
  selected,
  range,
  disabled,
  onSelect,
}: {
  file: File;
  selected: boolean;
  range: FileRange | undefined;
  disabled: boolean;
  onSelect: () => void;
}) {
  const thumbnail = useVideoThumbnail(file);
  const trimmed = isModified(range);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      onClick={onSelect}
      className="flex w-28 shrink-0 cursor-pointer flex-col gap-1.5 text-left disabled:cursor-default"
    >
      <span
        className={cn(
          "bg-muted relative block aspect-video overflow-hidden rounded-control border-2 transition-colors",
          selected ? "border-foreground" : "border-transparent",
        )}
      >
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="size-full object-cover" />
        )}
        {trimmed && (
          <span className="bg-scrim text-on-media absolute bottom-1 left-1 rounded-sm px-1.5 py-0.5 text-xs tabular-nums">
            {(range.end - range.start).toFixed(1)}s
          </span>
        )}
      </span>
      <span
        className={cn(
          "truncate text-xs",
          selected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {file.name}
      </span>
    </button>
  );
}

/** One frame near the start of the video, as a small data URL. */
function useVideoThumbnail(file: File): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setUrl(null);
    (async () => {
      try {
        const info = await readTrimVideoInfo(file);
        await extractFilmstrip({
          file,
          count: 1,
          duration: Math.min(info.duration, 2) || info.duration,
          frameWidth: 240,
          signal: controller.signal,
          draw: (frame) => {
            const canvas = document.createElement("canvas");
            canvas.width = 240;
            canvas.height = Math.max(1, Math.round(240 / info.aspectRatio));
            canvas
              .getContext("2d")
              ?.drawImage(frame, 0, 0, canvas.width, canvas.height);
            if (!controller.signal.aborted)
              setUrl(canvas.toDataURL("image/jpeg", 0.7));
          },
        });
      } catch {
        // No thumbnail for videos the browser can't decode; the tile still works.
      }
    })();
    return () => controller.abort();
  }, [file]);
  return url;
}
