import { describe, expect, it } from "vitest";
import {
  dragEnd,
  formatRulerLabel,
  rulerTicks,
  dragRange,
  dragStart,
  formatTrimTime,
  normalizeRange,
  resolveLimits,
  sampleTimes,
  snapToEdges,
  tileLayout,
  timeToX,
  xToTime,
  xToTimeUnclamped,
} from "../trim-math";

const limits = resolveLimits({ duration: 60, minDuration: 1 });

describe("trim math", () => {
  it("keeps the start edge below the end edge by the minimum duration", () => {
    const next = dragStart({
      range: { start: 10, end: 20 },
      time: 25,
      duration: 60,
      limits,
    });
    expect(next).toEqual({ start: 19, end: 20 });
  });

  it("keeps the end edge above the start edge and inside the video", () => {
    expect(
      dragEnd({
        range: { start: 10, end: 20 },
        time: 5,
        duration: 60,
        limits,
      }),
    ).toEqual({ start: 10, end: 11 });
    expect(
      dragEnd({
        range: { start: 10, end: 20 },
        time: 99,
        duration: 60,
        limits,
      }),
    ).toEqual({ start: 10, end: 60 });
  });

  it("honours a maximum duration when dragging either edge", () => {
    const capped = resolveLimits({
      duration: 60,
      minDuration: 1,
      maxDuration: 10,
    });
    expect(
      dragEnd({
        range: { start: 10, end: 15 },
        time: 40,
        duration: 60,
        limits: capped,
      }),
    ).toEqual({ start: 10, end: 20 });
    expect(
      dragStart({
        range: { start: 10, end: 15 },
        time: 0,
        duration: 60,
        limits: capped,
      }),
    ).toEqual({ start: 5, end: 15 });
  });

  it("slides the selection without changing its length", () => {
    const range = { start: 10, end: 20 };
    expect(dragRange({ range, start: 55, duration: 60 })).toEqual({
      start: 50,
      end: 60,
    });
    expect(dragRange({ range, start: -4, duration: 60 })).toEqual({
      start: 0,
      end: 10,
    });
  });

  it("normalizes arbitrary input into a valid range", () => {
    expect(
      normalizeRange({
        range: { start: 30, end: 10 },
        duration: 60,
        limits,
      }),
    ).toEqual({ start: 10, end: 30 });
    expect(
      normalizeRange({
        range: { start: 59.9, end: 59.95 },
        duration: 60,
        limits,
      }),
    ).toEqual({ start: 59, end: 60 });
  });

  it("never asks for a minimum longer than the source", () => {
    expect(resolveLimits({ duration: 0.4, minDuration: 1 }).minDuration).toBe(
      0.4,
    );
  });

  it("maps time to pixels and back", () => {
    expect(timeToX({ time: 15, duration: 60, width: 600 })).toBe(150);
    expect(xToTime({ x: 150, duration: 60, width: 600 })).toBe(15);
    expect(xToTime({ x: -20, duration: 60, width: 600 })).toBe(0);
    expect(xToTime({ x: 9999, duration: 60, width: 600 })).toBe(60);
  });

  it("lays out filmstrip tiles with the video's aspect ratio", () => {
    expect(tileLayout({ width: 600, height: 56, aspectRatio: 16 / 9 })).toEqual(
      { count: 6, tileWidth: 100 },
    );
    expect(tileLayout({ width: 0, height: 56, aspectRatio: 1.7 }).count).toBe(
      0,
    );
  });

  it("samples one timestamp from the middle of each tile slice", () => {
    expect(sampleTimes({ duration: 10, count: 4 })).toEqual([
      1.25, 3.75, 6.25, 8.75,
    ]);
  });

  it("formats times and durations", () => {
    expect(formatTrimTime(0)).toBe("0:00.0");
    expect(formatTrimTime(65.34)).toBe("1:05.3");
    expect(formatTrimTime(3723.4)).toBe("1:02:03.4");
  });

  it("picks a ruler step that keeps labels apart", () => {
    // The section count stays about the same whatever the length.
    const sections = (duration: number, width = 800) => {
      const { ticks } = rulerTicks({ duration, width });
      return ticks.filter((tick) => tick.major).length - 1;
    };
    expect(rulerTicks({ duration: 5, width: 800 }).step).toBe(1);
    expect(sections(5)).toBe(5);
    expect(rulerTicks({ duration: 27.4, width: 800 }).step).toBe(5);
    expect(sections(27.4)).toBe(5);
    expect(rulerTicks({ duration: 600, width: 800 }).step).toBe(120);

    // Four parts per 2 s step: small ticks every 0.5 s, the one at 1 s is the taller middle tick.
    const ten = rulerTicks({ duration: 10, width: 800 });
    expect(ten.step).toBe(2);
    expect(ten.ticks[1]).toMatchObject({ time: 0.5, major: false, mid: false });
    expect(ten.ticks[2]).toMatchObject({ time: 1, major: false, mid: true });

    // A narrow strip drops to fewer labels instead of crowding them.
    expect(rulerTicks({ duration: 10, width: 200 }).step).toBe(5);
    expect(rulerTicks({ duration: 0, width: 600 }).ticks).toEqual([]);
  });

  it("formats ruler labels by step", () => {
    expect(formatRulerLabel(5, 1)).toBe("0:05");
    expect(formatRulerLabel(90, 30)).toBe("1:30");
    expect(formatRulerLabel(3720, 600)).toBe("1:02:00");
    expect(formatRulerLabel(1.5, 0.5)).toBe("0:01.5");
  });

  it("reaches the ends from outside the strip and snaps near them", () => {
    expect(xToTimeUnclamped({ x: -14, duration: 60, width: 600 })).toBeCloseTo(
      -1.4,
    );
    expect(snapToEdges({ time: 0.4, duration: 60, width: 600 })).toBe(0);
    expect(snapToEdges({ time: 59.7, duration: 60, width: 600 })).toBe(60);
    expect(snapToEdges({ time: 30, duration: 60, width: 600 })).toBe(30);
  });
});
