import { createCanvasSurface } from "../canvas-utils";
import { gpuRenderer } from "../gpu-renderer";
import { buildGaussianBlurPasses, intensityToSigma } from "./gaussian";
let image: HTMLImageElement | null = null;
const callbacks = new Set<() => void>();
export const blurPreviewService = {
  onPreviewImageReady({ callback }: { callback: () => void }) {
    callbacks.add(callback);
    return () => {
      callbacks.delete(callback);
    };
  },
  renderPreview({
    intensity,
    targetCanvas,
    uniformDimensions,
  }: {
    intensity: number;
    targetCanvas: HTMLCanvasElement;
    uniformDimensions: { width: number; height: number };
  }) {
    if (!image) {
      image = new Image();
      image.onload = () => {
        for (const callback of callbacks) callback();
      };
      image.src = new URL(
        "../../../assets/blur-preview.jpg",
        import.meta.url,
      ).href;
    }
    if (!image.complete || !image.naturalWidth) return;
    const size = 160;
    targetCanvas.width = size;
    targetCanvas.height = size;
    const { canvas, context } = createCanvasSurface({
      width: size,
      height: size,
    });
    context.drawImage(image, 0, 0, size, size);
    const passes = buildGaussianBlurPasses({
      sigmaX: intensityToSigma({
        intensity,
        resolution: uniformDimensions.width,
        reference: 1920,
      }),
      sigmaY: intensityToSigma({
        intensity,
        resolution: uniformDimensions.height,
        reference: 1080,
      }),
    });
    targetCanvas
      .getContext("2d")
      ?.drawImage(
        gpuRenderer.applyBlur({
          source: canvas,
          width: size,
          height: size,
          passes,
        }),
        0,
        0,
      );
  },
  clear() {
    callbacks.clear();
    if (image) image.onload = null;
    image = null;
  },
};
