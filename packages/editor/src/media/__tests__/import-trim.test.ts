import { beforeEach, describe, expect, it } from "vitest";
import { requestImportTrim, useImportTrimStore } from "../import-trim";

const video = new File(["v"], "clip.mp4", { type: "video/mp4" });
const image = new File(["i"], "pic.png", { type: "image/png" });

describe("requestImportTrim", () => {
  beforeEach(() => {
    useImportTrimStore.setState({
      enabled: true,
      hasDialog: true,
      request: null,
    });
  });

  it("passes files through when there is no video", async () => {
    await expect(requestImportTrim({ files: [image] })).resolves.toEqual([
      image,
    ]);
    expect(useImportTrimStore.getState().request).toBeNull();
  });

  it("passes files through when the option is off or no dialog is mounted", async () => {
    useImportTrimStore.setState({ enabled: false });
    await expect(requestImportTrim({ files: [video] })).resolves.toEqual([
      video,
    ]);
    useImportTrimStore.setState({ enabled: true, hasDialog: false });
    await expect(requestImportTrim({ files: [video] })).resolves.toEqual([
      video,
    ]);
  });

  it("waits for the dialog when a video is imported", async () => {
    const pending = requestImportTrim({ files: [video, image] });
    const request = useImportTrimStore.getState().request;
    expect(request?.files).toEqual([video, image]);
    const trimmed = new File(["t"], "clip-trimmed.mp4", { type: "video/mp4" });
    request?.resolve([trimmed, image]);
    await expect(pending).resolves.toEqual([trimmed, image]);
  });

  it("answers null for a request that a newer import replaces", async () => {
    const first = requestImportTrim({ files: [video] });
    void requestImportTrim({ files: [video] });
    await expect(first).resolves.toBeNull();
  });
});
