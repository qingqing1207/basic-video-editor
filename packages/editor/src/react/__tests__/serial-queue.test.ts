import { describe, expect, it } from "vitest";
import { createSerialQueue } from "../serial-queue";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("serial queue", () => {
  it("never overlaps tasks and keeps submission order", async () => {
    const enqueue = createSerialQueue();
    const log: string[] = [];
    let running = 0;
    const task = (name: string, delay: number) => async () => {
      running++;
      expect(running).toBe(1);
      log.push(`start ${name}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      log.push(`end ${name}`);
      running--;
    };
    await Promise.all([enqueue(task("create", 20)), enqueue(task("destroy", 5)), enqueue(task("create-2", 1))]);
    expect(log).toEqual(["start create", "end create", "start destroy", "end destroy", "start create-2", "end create-2"]);
  });

  it("keeps running after a task fails and reports that failure to its caller", async () => {
    const enqueue = createSerialQueue();
    const failing = enqueue(async () => {
      throw new Error("boom");
    });
    const next = enqueue(async () => "still runs");
    await expect(failing).rejects.toThrow("boom");
    await expect(next).resolves.toBe("still runs");
    await tick();
  });
});
