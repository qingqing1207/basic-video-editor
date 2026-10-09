"use client";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PauseIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/ui";
import { useEditorTheme } from "@/theme/use-editor-theme";
import type { VideoTrimmerHandle, VideoTrimmerProps } from "@/index";
import { TrimCanceledError } from "./errors";
import {
  extractFilmstrip,
  readTrimVideoInfo,
  trimVideoFile,
  type TrimResult,
  type TrimVideoInfo,
} from "./trim-file";
import {
  clamp,
  dragEnd,
  dragRange,
  dragStart,
  formatRulerLabel,
  formatTrimTime,
  normalizeRange,
  resolveLimits,
  rulerTicks,
  snapToEdges,
  tileLayout,
  timeToX,
  xToTimeUnclamped,
  type TrimRange,
} from "./trim-math";

const STRIP_HEIGHT = 56;
const HANDLE_WIDTH = 14;
const DEFAULT_PREVIEW_MAX_HEIGHT = 352;
const KEY_STEP = 0.1;
const KEY_STEP_LARGE = 1;
/** A press that moves less than this (px) is a click, not a drag of the selection. */
const CLICK_SLOP = 3;

type DragMode = "start" | "end" | "range" | "seek";
interface DragState {
  mode: DragMode;
  pointerId: number;
  originX: number;
  moved: boolean;
  /** Pointer time minus the edge time at press, so the edge doesn't jump to the cursor. */
  grabOffset: number;
  initial: TrimRange;
}

export default function VideoTrimmerView({
  ref,
  file,
  defaultRange,
  onRangeChange,
  bare = false,
  previewMaxHeight = DEFAULT_PREVIEW_MAX_HEIGHT,
  minDuration,
  maxDuration,
  onStatusChange,
  onError,
  theme: controlledTheme,
  defaultTheme = "light",
  appearance,
  density = "comfortable",
  className,
  style,
}: VideoTrimmerProps & { ref?: Ref<VideoTrimmerHandle> }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const theme = controlledTheme ?? defaultTheme;
  const { themeStyle } = useEditorTheme({
    root,
    portal: null,
    theme,
    appearance,
    density,
    style,
  });

  const [info, setInfo] = useState<TrimVideoInfo | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [range, setRange] = useState<TrimRange | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState<DragMode | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rangeRef = useRef<TrimRange | null>(null);
  const durationRef = useRef(0);
  const resumeTimer = useRef<number | undefined>(undefined);
  const [stripWidth, setStripWidth] = useState(0);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;

  // Created in an effect, not during render: React strict mode mounts, unmounts and mounts again,
  // and a URL revoked by the first cleanup would never be recreated.
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setVideoUrl(null);
    };
  }, [file]);

  const busy = progress !== null;
  const duration = info?.duration ?? 0;
  const limits = useMemo(
    () => resolveLimits({ duration, minDuration, maxDuration }),
    [duration, minDuration, maxDuration],
  );

  // Read the file once per source.
  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setLoadError(null);
    setRange(null);
    setTime(0);
    readTrimVideoInfo(file).then(
      (result) => {
        if (cancelled) return;
        const initial = normalizeRange({
          range: defaultRange ?? { start: 0, end: result.duration },
          duration: result.duration,
          limits: resolveLimits({
            duration: result.duration,
            minDuration,
            maxDuration,
          }),
        });
        durationRef.current = result.duration;
        setInfo(result);
        rangeRef.current = initial;
        setRange(initial);
        setTime(initial.start);
        onRangeChangeRef.current?.(initial, { duration: result.duration });
        requestAnimationFrame(() => {
          if (videoRef.current) videoRef.current.currentTime = initial.start;
        });
      },
      (error: unknown) => {
        if (cancelled) return;
        const failure =
          error instanceof Error ? error : new Error(String(error));
        setLoadError(failure);
        onErrorRef.current?.(failure);
      },
    );
    return () => {
      cancelled = true;
    };
    // The initial range and limits only apply when a new file loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Track the strip's width.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const observer = new ResizeObserver(([entry]) => {
      setStripWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(strip);
    setStripWidth(Math.round(strip.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, [info]);

  // Paint the filmstrip: real frames spread evenly across the whole video.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!info || !canvas || stripWidth <= 0) return;
    const ratio = window.devicePixelRatio || 1;
    const layout = tileLayout({
      width: stripWidth,
      height: STRIP_HEIGHT,
      aspectRatio: info.aspectRatio,
    });
    canvas.width = Math.round(stripWidth * ratio);
    canvas.height = Math.round(STRIP_HEIGHT * ratio);
    const context = canvas.getContext("2d");
    if (!context || layout.count === 0) return;

    const controller = new AbortController();
    const tilePx = layout.tileWidth * ratio;
    const timer = window.setTimeout(() => {
      extractFilmstrip({
        file,
        count: layout.count,
        duration: info.duration,
        frameWidth: tilePx,
        signal: controller.signal,
        draw: (frame, index) => {
          const x = Math.round(index * tilePx);
          const next = Math.round((index + 1) * tilePx);
          context.drawImage(frame, x, 0, next - x, canvas.height);
        },
      }).catch(() => {
        // A strip that fails to paint leaves the placeholder; the selection still works.
      });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [file, info, stripWidth]);

  const commitRange = useCallback((next: TrimRange) => {
    rangeRef.current = next;
    setRange(next);
    onRangeChangeRef.current?.(next, { duration: durationRef.current });
  }, []);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = seconds;
    setTime(seconds);
  }, []);

  // Keep the playhead in sync and loop inside the selection while playing.
  useEffect(() => {
    if (!playing || !range) return;
    const video = videoRef.current;
    if (!video) return;
    let frame = 0;
    const tick = () => {
      if (video.currentTime >= range.end || video.ended) {
        video.currentTime = range.start;
        if (video.paused) void video.play().catch(() => setPlaying(false));
      }
      setTime(video.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, range]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !range) return;
    if (playing) {
      video.pause();
      setPlaying(false);
      return;
    }
    if (
      video.currentTime < range.start ||
      video.currentTime >= range.end - 0.05
    )
      video.currentTime = range.start;
    void video.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [playing, range]);

  const pause = useCallback(() => {
    window.clearTimeout(resumeTimer.current);
    videoRef.current?.pause();
    setPlaying(false);
  }, []);

  /** After an edit the preview waits at the selection's first frame; the user starts playback. */
  const resetToStart = useCallback(() => {
    const video = videoRef.current;
    const current = rangeRef.current;
    if (!video || !current) return;
    video.pause();
    setPlaying(false);
    video.currentTime = current.start;
    setTime(current.start);
  }, []);

  const resetToStartSoon = useCallback(() => {
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(resetToStart, 400);
  }, [resetToStart]);

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const stripTime = useCallback(
    (clientX: number) => {
      const rect = stripRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return xToTimeUnclamped({
        x: clientX - rect.left,
        duration,
        width: rect.width,
      });
    },
    [duration],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!range || busy || event.button !== 0) return;
    const handle = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-trim-handle]",
    )?.dataset.trimHandle;
    const pointerTime = stripTime(event.clientX);
    let mode: DragMode = "seek";
    let grabOffset = 0;
    if (handle === "start") {
      mode = "start";
      grabOffset = pointerTime - range.start;
    } else if (handle === "end") {
      mode = "end";
      grabOffset = pointerTime - range.end;
    } else if (pointerTime >= range.start && pointerTime <= range.end) {
      mode = "range";
      grabOffset = pointerTime - range.start;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      originX: event.clientX,
      moved: false,
      grabOffset,
      initial: range,
    };
    if (mode === "start" || mode === "end") {
      pause();
      setDragging(mode);
    }
    event.preventDefault();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !range) return;
    if (!drag.moved && Math.abs(event.clientX - drag.originX) < CLICK_SLOP)
      return;
    drag.moved = true;
    const pointerTime = stripTime(event.clientX);

    if (drag.mode === "start") {
      const next = dragStart({
        range,
        // A pointer at or past the track's left edge always means the very start.
        time:
          pointerTime <= 0
            ? 0
            : snapToEdges({
                time: pointerTime - drag.grabOffset,
                duration,
                width: stripWidth,
              }),
        duration,
        limits,
      });
      commitRange(next);
      seek(next.start);
    } else if (drag.mode === "end") {
      const next = dragEnd({
        range,
        // A pointer at or past the track's right edge always means the very end.
        time:
          pointerTime >= duration
            ? duration
            : snapToEdges({
                time: pointerTime - drag.grabOffset,
                duration,
                width: stripWidth,
              }),
        duration,
        limits,
      });
      commitRange(next);
      seek(Math.max(next.start, next.end - 0.05));
    } else if (drag.mode === "range") {
      if (dragging !== "range") {
        pause();
        setDragging("range");
      }
      const next = dragRange({
        range: drag.initial,
        start: pointerTime - drag.grabOffset,
        duration,
      });
      commitRange(next);
      seek(next.start);
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    // After an edit the preview returns to the selection start, paused.
    if (drag.moved) resetToStart();
  };

  const onHandleKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    edge: "start" | "end",
  ) => {
    if (!range || busy) return;
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const current = edge === "start" ? range.start : range.end;
    let target: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown")
      target = current - step;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp")
      target = current + step;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = duration;
    if (target === null) return;
    event.preventDefault();
    pause();
    const next =
      edge === "start"
        ? dragStart({ range, time: target, duration, limits })
        : dragEnd({ range, time: target, duration, limits });
    commitRange(next);
    seek(edge === "start" ? next.start : Math.max(next.start, next.end - 0.05));
    resetToStartSoon();
  };

  const run = useCallback(async (): Promise<TrimResult> => {
    if (!range) throw new Error("The video is still loading.");
    pause();
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await trimVideoFile({
        file,
        start: range.start,
        end: range.end,
        signal: controller.signal,
        onProgress: setProgress,
      });
      return result;
    } catch (error) {
      throw error;
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  }, [file, pause, range]);

  /** Back to the whole video (limited by `maxDuration`), preview at its first frame. */
  const reset = useCallback(() => {
    if (!info || busy) return;
    const full = normalizeRange({
      range: { start: 0, end: info.duration },
      duration: info.duration,
      limits,
    });
    pause();
    commitRange(full);
    seek(full.start);
  }, [busy, commitRange, info, limits, pause, seek]);

  useImperativeHandle(
    ref,
    () => ({
      trim: run,
      cancel: () => abortRef.current?.abort(),
      reset,
      getRange: () => range,
    }),
    [range, reset, run],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const ready = info !== null && range !== null;
  useEffect(() => {
    onStatusChangeRef.current?.({
      ready,
      trimming: busy,
      progress: progress ?? 0,
    });
  }, [ready, busy, progress]);
  const previewAspect = info ? clamp(info.aspectRatio, 9 / 16, 16 / 9) : 16 / 9;
  const startX = ready
    ? timeToX({ time: range.start, duration, width: stripWidth })
    : 0;
  const endX = ready
    ? timeToX({ time: range.end, duration, width: stripWidth })
    : 0;
  const ruler = useMemo(
    () => rulerTicks({ duration, width: stripWidth }),
    [duration, stripWidth],
  );

  return (
    <div
      ref={setRoot}
      data-video-trimmer=""
      data-density={density}
      className={cn("bve-scope", theme, className)}
      style={{ ...themeStyle, ...style }}
    >
      <div
        className={cn(
          "text-foreground flex w-full flex-col gap-4 select-none",
          !bare && "bg-panel rounded-panel border p-4",
        )}
      >
        {loadError ? null : (
          <>
            <div
              className="relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-overlay bg-media-backdrop"
              style={{
                aspectRatio: previewAspect,
                maxWidth: previewMaxHeight * previewAspect,
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl ?? undefined}
                playsInline
                muted={muted}
                preload="auto"
                className="size-full cursor-pointer object-contain"
                onClick={togglePlay}
                onEnded={() => setPlaying(false)}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner className="text-on-media size-6" />
                </div>
              )}
              {ready && (
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={busy}
                  aria-label={playing ? "Pause" : "Play"}
                  className="bg-scrim text-on-media absolute bottom-3 left-3 flex cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-2 text-xs font-medium tabular-nums transition-opacity hover:opacity-90 disabled:cursor-default"
                >
                  <HugeiconsIcon
                    icon={playing ? PauseIcon : PlayIcon}
                    className="size-4"
                  />
                  {formatTrimTime(time)}
                </button>
              )}
              {ready && (
                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  aria-label={muted ? "Unmute" : "Mute"}
                  aria-pressed={!muted}
                  className="bg-scrim text-on-media absolute right-3 bottom-3 flex size-7 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-90"
                >
                  <HugeiconsIcon
                    icon={muted ? VolumeMute02Icon : VolumeHighIcon}
                    className="size-4"
                  />
                </button>
              )}
            </div>

            <div
              className={cn(
                "relative touch-none pt-7",
                busy && "pointer-events-none opacity-60",
              )}
              style={{ paddingInline: HANDLE_WIDTH }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {ready && stripWidth > 0 && (
                <div
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute top-0 h-6"
                  style={{ left: HANDLE_WIDTH, width: stripWidth }}
                >
                  {ruler.ticks.map((tick) => (
                    <div
                      key={tick.time}
                      className="absolute inset-y-0"
                      style={{ left: tick.x }}
                    >
                      <span
                        className={cn(
                          "bg-border-strong absolute bottom-0 w-px -translate-x-1/2",
                          tick.major ? "h-2.5" : tick.mid ? "h-1.5" : "h-1",
                        )}
                      />
                      {tick.major && (
                        <span
                          className={cn(
                            "absolute top-0 text-xs leading-none whitespace-nowrap tabular-nums",
                            tick.x <= 1
                              ? "left-0"
                              : tick.x >= stripWidth - 1
                                ? "right-0"
                                : "-translate-x-1/2",
                          )}
                        >
                          {formatRulerLabel(tick.time, ruler.step)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div
                ref={stripRef}
                className="bg-muted relative overflow-hidden rounded-sm"
                style={{ height: STRIP_HEIGHT }}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 size-full"
                  aria-hidden="true"
                />
                {ready && (
                  <>
                    <div
                      className="bg-scrim absolute inset-y-0 left-0"
                      style={{ width: startX }}
                    />
                    <div
                      className="bg-scrim absolute inset-y-0 right-0"
                      style={{ width: stripWidth - endX }}
                    />
                  </>
                )}
              </div>

              {ready && (
                <div
                  className="pointer-events-none absolute bottom-0 top-7"
                  style={{ left: HANDLE_WIDTH, right: HANDLE_WIDTH }}
                >
                  <div
                    className={cn(
                      "pointer-events-auto absolute inset-y-0",
                      dragging === "range" ? "cursor-grabbing" : "cursor-grab",
                    )}
                    style={{ left: startX, width: endX - startX }}
                  >
                    <div className="bg-foreground absolute inset-x-0 top-0 h-[3px]" />
                    <div className="bg-foreground absolute inset-x-0 bottom-0 h-[3px]" />
                  </div>

                  <TrimHandle
                    edge="start"
                    x={startX}
                    time={range.start}
                    min={0}
                    max={range.end}
                    active={dragging === "start"}
                    onKeyDown={onHandleKeyDown}
                  />
                  <TrimHandle
                    edge="end"
                    x={endX}
                    time={range.end}
                    min={range.start}
                    max={duration}
                    active={dragging === "end"}
                    onKeyDown={onHandleKeyDown}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TrimHandle({
  edge,
  x,
  time,
  min,
  max,
  active,
  onKeyDown,
}: {
  edge: "start" | "end";
  x: number;
  time: number;
  min: number;
  max: number;
  active: boolean;
  onKeyDown: (
    event: ReactKeyboardEvent<HTMLDivElement>,
    edge: "start" | "end",
  ) => void;
}) {
  const isStart = edge === "start";
  return (
    <div
      data-trim-handle={edge}
      role="slider"
      tabIndex={0}
      aria-label={isStart ? "Trim start" : "Trim end"}
      aria-orientation="horizontal"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={time}
      aria-valuetext={formatTrimTime(time)}
      onKeyDown={(event) => onKeyDown(event, edge)}
      className={cn(
        "bg-foreground text-background group pointer-events-auto absolute inset-y-0 flex cursor-ew-resize items-center justify-center outline-none",
        isStart ? "rounded-l-control" : "rounded-r-control",
      )}
      style={{
        width: HANDLE_WIDTH,
        left: isStart ? x - HANDLE_WIDTH : x,
      }}
    >
      <span className="bg-panel/70 group-hover:bg-panel group-focus-visible:bg-panel h-5 w-0.5 rounded-full transition-colors" />
      <span
        className={cn(
          "bg-foreground text-background pointer-events-none absolute -top-7 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium tabular-nums opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
          active && "opacity-100",
          isStart ? "left-0" : "right-0",
        )}
      >
        {formatTrimTime(time)}
      </span>
    </div>
  );
}
