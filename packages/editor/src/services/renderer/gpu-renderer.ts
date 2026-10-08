import {
  applyBlurPasses,
  applyMaskFeather as applyMaskFeatherWasm,
  initializeGpu,
  disposeGpu,
} from "@basic-video-editor/render-wasm";
import type { BlurPass } from "@/services/renderer/blur/types";

let gpuAvailable = false;
let initPromise: Promise<void> | null = null;

export function initializeGpuRenderer(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeGpu()
      .then(() => {
        gpuAvailable = true;
      })
      .catch((error: unknown) => {
        gpuAvailable = false;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`GPU renderer unavailable: ${message}`);
      });
  }
  return initPromise;
}

export function isGpuAvailable(): boolean {
  return gpuAvailable;
}

export const gpuRenderer = {
  applyBlur({
    source,
    width,
    height,
    passes,
  }: {
    source: OffscreenCanvas;
    width: number;
    height: number;
    passes: BlurPass[];
  }): OffscreenCanvas {
    if (passes.length === 0 || !gpuAvailable) {
      return source;
    }

    return applyBlurPasses({
      source,
      width,
      height,
      passes: passes,
    });
  },

  applyMaskFeather({
    maskCanvas,
    width,
    height,
    feather,
  }: {
    maskCanvas: OffscreenCanvas;
    width: number;
    height: number;
    feather: number;
  }): OffscreenCanvas {
    if (!gpuAvailable) {
      return maskCanvas;
    }

    return applyMaskFeatherWasm({
      mask: maskCanvas,
      width,
      height,
      feather,
    });
  },
};

export function disposeGpuRenderer() {
  disposeGpu();
  gpuAvailable = false;
  initPromise = null;
}
