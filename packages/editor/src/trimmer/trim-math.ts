/** Pure helpers for the video trimmer: time <-> pixel mapping, range limits, formatting. */

export interface TrimRange {
  /** Seconds from the start of the source. */
  start: number;
  end: number;
}

export interface TrimLimits {
  /** Shortest allowed selection in seconds. */
  minDuration: number;
  /** Longest allowed selection in seconds; `Infinity` means unrestricted. */
  maxDuration: number;
}

export const DEFAULT_MIN_DURATION = 0.1;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Limits that can actually be satisfied by a source of `duration` seconds. */
export function resolveLimits({
  duration,
  minDuration = DEFAULT_MIN_DURATION,
  maxDuration = Number.POSITIVE_INFINITY,
}: {
  duration: number;
  minDuration?: number;
  maxDuration?: number;
}): TrimLimits {
  const min = clamp(minDuration, 0, duration);
  return { minDuration: min, maxDuration: Math.max(min, maxDuration) };
}

/** Fits an arbitrary range into [0, duration] while honouring the limits. */
export function normalizeRange({
  range,
  duration,
  limits,
}: {
  range: TrimRange;
  duration: number;
  limits: TrimLimits;
}): TrimRange {
  let start = clamp(range.start, 0, duration);
  let end = clamp(range.end, 0, duration);
  if (end < start) [start, end] = [end, start];

  if (end - start > limits.maxDuration) end = start + limits.maxDuration;
  if (end - start < limits.minDuration) {
    end = start + limits.minDuration;
    if (end > duration) {
      end = duration;
      start = Math.max(0, end - limits.minDuration);
    }
  }
  return { start, end };
}

/** Moves the start edge. The end edge stays put. */
export function dragStart({
  range,
  time,
  duration,
  limits,
}: {
  range: TrimRange;
  time: number;
  duration: number;
  limits: TrimLimits;
}): TrimRange {
  const lowest = Math.max(0, range.end - limits.maxDuration);
  const highest = Math.max(lowest, range.end - limits.minDuration);
  return {
    start: clamp(time, lowest, Math.min(highest, duration)),
    end: range.end,
  };
}

/** Moves the end edge. The start edge stays put. */
export function dragEnd({
  range,
  time,
  duration,
  limits,
}: {
  range: TrimRange;
  time: number;
  duration: number;
  limits: TrimLimits;
}): TrimRange {
  const lowest = Math.min(duration, range.start + limits.minDuration);
  const highest = Math.min(duration, range.start + limits.maxDuration);
  return {
    start: range.start,
    end: clamp(time, lowest, Math.max(lowest, highest)),
  };
}

/** Slides the whole selection, keeping its length. */
export function dragRange({
  range,
  start,
  duration,
}: {
  range: TrimRange;
  start: number;
  duration: number;
}): TrimRange {
  const length = range.end - range.start;
  const nextStart = clamp(start, 0, Math.max(0, duration - length));
  return { start: nextStart, end: nextStart + length };
}

/** Pointer position to time without limiting it to the video, so edges can be reached from outside the strip. */
export function xToTimeUnclamped({
  x,
  duration,
  width,
}: {
  x: number;
  duration: number;
  width: number;
}): number {
  return width > 0 ? (x / width) * duration : 0;
}

/** Pulls a time to 0 or `duration` when it is within `threshold` pixels of either. */
export function snapToEdges({
  time,
  duration,
  width,
  threshold = 6,
}: {
  time: number;
  duration: number;
  width: number;
  threshold?: number;
}): number {
  if (width <= 0 || duration <= 0) return time;
  const slack = (threshold / width) * duration;
  if (time <= slack) return 0;
  if (time >= duration - slack) return duration;
  return time;
}

export function timeToX({
  time,
  duration,
  width,
}: {
  time: number;
  duration: number;
  width: number;
}): number {
  return duration > 0 ? (time / duration) * width : 0;
}

export function xToTime({
  x,
  duration,
  width,
}: {
  x: number;
  duration: number;
  width: number;
}): number {
  return width > 0 ? clamp((x / width) * duration, 0, duration) : 0;
}

/** Filmstrip tiles that fill `width` with frames of the video's own aspect ratio. */
export function tileLayout({
  width,
  height,
  aspectRatio,
}: {
  width: number;
  height: number;
  aspectRatio: number;
}): { count: number; tileWidth: number } {
  if (width <= 0 || height <= 0 || !Number.isFinite(aspectRatio))
    return { count: 0, tileWidth: 0 };
  const natural = height * aspectRatio;
  const count = Math.max(1, Math.round(width / natural));
  return { count, tileWidth: width / count };
}

/** One timestamp per tile, taken from the middle of the tile's slice of the video. */
export function sampleTimes({
  duration,
  count,
}: {
  duration: number;
  count: number;
}): number[] {
  return Array.from(
    { length: count },
    (_, index) => ((index + 0.5) / count) * duration,
  );
}

/** `1:05.3`, or `1:02:03.4` for sources over an hour. */
export function formatTrimTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const tenths = Math.floor(safe * 10 + 1e-6);
  const whole = Math.floor(tenths / 10);
  const fraction = tenths % 10;
  const secs = whole % 60;
  const mins = Math.floor(whole / 60) % 60;
  const hours = Math.floor(whole / 3600);
  const ss = String(secs).padStart(2, "0");
  if (hours > 0)
    return `${hours}:${String(mins).padStart(2, "0")}:${ss}.${fraction}`;
  return `${mins}:${ss}.${fraction}`;
}

/** Labelled interval in seconds, and how many equal parts it is divided into by small ticks. */
const RULER_STEPS: ReadonlyArray<readonly [step: number, parts: number]> = [
  [0.1, 5],
  [0.2, 4],
  [0.5, 5],
  [1, 5],
  [2, 4],
  [5, 5],
  [10, 5],
  [15, 3],
  [30, 6],
  [60, 6],
  [120, 4],
  [300, 5],
  [600, 5],
  [900, 3],
  [1800, 6],
  [3600, 6],
  [7200, 4],
];

export interface RulerTick {
  time: number;
  x: number;
  /** Labelled tick. */
  major: boolean;
  /** Halfway between two major ticks, drawn a little taller than the rest. */
  mid: boolean;
}

/**
 * Ticks for a time ruler over `width` pixels. The labelled step is the smallest round interval
 * that gives at most `maxIntervals` labelled sections and keeps labels at least `minLabelGap`
 * pixels apart, so the ruler looks the same for a 5 s clip and a 5 min one. Small ticks fill between.
 */
export function rulerTicks({
  duration,
  width,
  minLabelGap = 56,
  maxIntervals = 6,
}: {
  duration: number;
  width: number;
  minLabelGap?: number;
  maxIntervals?: number;
}): { ticks: RulerTick[]; step: number } {
  if (duration <= 0 || width <= 0) return { ticks: [], step: 1 };
  const [step, parts] =
    RULER_STEPS.find(
      ([candidate]) =>
        duration / candidate <= maxIntervals &&
        (candidate / duration) * width >= minLabelGap,
    ) ?? RULER_STEPS[RULER_STEPS.length - 1];
  const unit = step / parts;
  const ticks: RulerTick[] = [];
  const count = Math.floor(duration / unit + 1e-9);
  for (let index = 0; index <= count; index += 1) {
    const time = Number((index * unit).toFixed(6));
    const inStep = index % parts;
    ticks.push({
      time,
      x: timeToX({ time, duration, width }),
      major: inStep === 0,
      mid: parts % 2 === 0 && inStep === parts / 2,
    });
  }
  return { ticks, step };
}

/** `0:05`, `1:30`, `1:02:00`; sub-second steps keep one decimal (`0:01.5`). */
export function formatRulerLabel(seconds: number, step: number): string {
  if (step < 1) return formatTrimTime(seconds);
  const whole = Math.round(seconds);
  const secs = whole % 60;
  const mins = Math.floor(whole / 60) % 60;
  const hours = Math.floor(whole / 3600);
  const ss = String(secs).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(mins).padStart(2, "0")}:${ss}`
    : `${mins}:${ss}`;
}
