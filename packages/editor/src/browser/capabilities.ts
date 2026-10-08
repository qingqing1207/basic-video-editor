/** Runtime feature probes; codec support remains dependent on codec/profile and hardware. */
export async function detectCapabilities() {
  const browser = typeof window !== "undefined";
  const video = async (codec: string) => {
    if (!browser || typeof VideoEncoder === "undefined") return false;
    try {
      return Boolean(
        (
          await VideoEncoder.isConfigSupported({
            codec,
            width: 640,
            height: 360,
            bitrate: 1_000_000,
            framerate: 30,
          })
        ).supported,
      );
    } catch {
      return false;
    }
  };
  const audio = async (codec: string) => {
    if (!browser || typeof AudioEncoder === "undefined") return false;
    try {
      return Boolean(
        (
          await AudioEncoder.isConfigSupported({
            codec,
            numberOfChannels: 2,
            sampleRate: 44100,
            bitrate: 128000,
          })
        ).supported,
      );
    } catch {
      return false;
    }
  };
  const [h264, vp9, aac, opus] = await Promise.all([
    video("avc1.42001f"),
    video("vp09.00.10.08"),
    audio("mp4a.40.2"),
    audio("opus"),
  ]);
  return {
    secureContext: browser && window.isSecureContext,
    indexedDB: browser && typeof indexedDB !== "undefined",
    opfs: browser && Boolean(navigator.storage?.getDirectory),
    webgpuAPI: browser && "gpu" in navigator,
    videoDecoder: browser && typeof VideoDecoder !== "undefined",
    videoEncoder: browser && typeof VideoEncoder !== "undefined",
    audioDecoder: browser && typeof AudioDecoder !== "undefined",
    audioEncoder: browser && typeof AudioEncoder !== "undefined",
    offscreenCanvas: browser && typeof OffscreenCanvas !== "undefined",
    encoding: { h264, vp9, aac, opus },
  };
}
