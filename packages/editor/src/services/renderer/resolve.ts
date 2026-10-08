import { mediaTimeToSeconds, roundMediaTime } from "@/wasm";
import { getElementLocalTime } from "@/animation";
import {
  buildGaussianBlurPasses,
  intensityToSigma,
} from "@/services/renderer/blur/gaussian";
import { getSourceTimeAtClipTime } from "@/retime";
import {
  buildTextBackgroundFromElement,
  getTextMeasurementContext,
  measureTextElement,
} from "@/text/measure-element";
import { resolveColorAtTime, resolveOpacityAtTime } from "@/animation/values";
import { resolveTransformAtTime } from "@/rendering/animation-values";
import { videoCache } from "@/services/video-cache/service";
import type { CanvasRenderer } from "./canvas-renderer";
import type { AnyBaseNode } from "./nodes/base-node";
import {
  BlurBackgroundNode,
  type BackdropSource,
  type ResolvedBlurBackgroundNodeState,
} from "./nodes/blur-background-node";
import { ImageNode, loadImageSource } from "./nodes/image-node";
import { TextNode, type ResolvedTextNodeState } from "./nodes/text-node";
import { VideoNode } from "./nodes/video-node";
import type {
  ResolvedVisualNodeState,
  ResolvedVisualSourceNodeState,
  VisualNodeParams,
} from "./nodes/visual-node";

type ResolveContext = {
  renderer: CanvasRenderer;
  time: number;
};

export async function resolveRenderTree({
  node,
  renderer,
  time,
}: {
  node: AnyBaseNode;
  renderer: CanvasRenderer;
  time: number;
}): Promise<void> {
  await resolveNode({
    node,
    context: {
      renderer,
      time,
    },
  });
}

async function resolveNode({
  node,
  context,
}: {
  node: AnyBaseNode;
  context: ResolveContext;
}): Promise<void> {
  if (node instanceof VideoNode) {
    node.resolved = await resolveVideoNode({ node, context });
  } else if (node instanceof ImageNode) {
    node.resolved = await resolveImageNode({ node, context });
  } else if (node instanceof TextNode) {
    node.resolved = resolveTextNode({ node, context });
  } else if (node instanceof BlurBackgroundNode) {
    node.resolved = await resolveBlurBackgroundNode({ node, context });
  } else {
  }

  await Promise.all(
    node.children.map((child) => resolveNode({ node: child, context })),
  );
}

function resolveVisualState({
  params,
  context,
  sourceWidth,
  sourceHeight,
}: {
  params: VisualNodeParams;
  context: ResolveContext;
  sourceWidth: number;
  sourceHeight: number;
}): ResolvedVisualNodeState | null {
  const clipTime = context.time - params.timeOffset;
  if (clipTime < 0 || clipTime >= params.duration) {
    return null;
  }

  const localTime = getElementLocalTime({
    timelineTime: context.time,
    elementStartTime: params.timeOffset,
    elementDuration: params.duration,
  });
  const transform = resolveTransformAtTime({
    baseTransform: params.transform,
    animations: params.animations,
    localTime,
  });
  const opacity = resolveOpacityAtTime({
    baseOpacity: params.opacity,
    animations: params.animations,
    localTime,
  });
  const containScale = Math.min(
    context.renderer.width / sourceWidth,
    context.renderer.height / sourceHeight,
  );
  const effectWidth = Math.round(
    Math.abs(sourceWidth * containScale * transform.scaleX),
  );
  const effectHeight = Math.round(
    Math.abs(sourceHeight * containScale * transform.scaleY),
  );

  return {
    localTime,
    transform,
    opacity,
  };
}

async function resolveVideoNode({
  node,
  context,
}: {
  node: VideoNode;
  context: ResolveContext;
}): Promise<ResolvedVisualSourceNodeState | null> {
  const clipTime = context.time - node.params.timeOffset;
  if (clipTime < 0 || clipTime >= node.params.duration) {
    return null;
  }

  const sourceTimeTicks =
    node.params.trimStart +
    getSourceTimeAtClipTime({
      clipTime,
      retime: node.params.retime,
    });
  const frame = await videoCache.getFrameAt({
    mediaId: node.params.mediaId,
    file: node.params.file,
    time: mediaTimeToSeconds({
      time: roundMediaTime({ time: sourceTimeTicks }),
    }),
  });
  if (!frame) {
    return null;
  }

  const visualState = resolveVisualState({
    params: node.params,
    context,
    sourceWidth: frame.canvas.width,
    sourceHeight: frame.canvas.height,
  });
  if (!visualState) {
    return null;
  }

  return {
    ...visualState,
    source: frame.canvas,
    sourceWidth: frame.canvas.width,
    sourceHeight: frame.canvas.height,
  };
}

async function resolveImageNode({
  node,
  context,
}: {
  node: ImageNode;
  context: ResolveContext;
}): Promise<ResolvedVisualSourceNodeState | null> {
  const source = await loadImageSource({
    url: node.params.url,
    maxSourceSize: node.params.maxSourceSize,
  });
  const visualState = resolveVisualState({
    params: node.params,
    context,
    sourceWidth: source.width,
    sourceHeight: source.height,
  });
  if (!visualState) {
    return null;
  }

  return {
    ...visualState,
    source: source.source,
    sourceWidth: source.width,
    sourceHeight: source.height,
  };
}

function resolveTextNode({
  node,
  context,
}: {
  node: TextNode;
  context: ResolveContext;
}): ResolvedTextNodeState | null {
  if (
    context.time < node.params.startTime ||
    context.time >= node.params.startTime + node.params.duration
  ) {
    return null;
  }

  const localTime = getElementLocalTime({
    timelineTime: context.time,
    elementStartTime: node.params.startTime,
    elementDuration: node.params.duration,
  });
  const background = buildTextBackgroundFromElement({ element: node.params });

  return {
    transform: resolveTransformAtTime({
      baseTransform: node.params.transform,
      animations: node.params.animations,
      localTime,
    }),
    opacity: resolveOpacityAtTime({
      baseOpacity: node.params.opacity,
      animations: node.params.animations,
      localTime,
    }),
    textColor: resolveColorAtTime({
      baseColor:
        typeof node.params.params.color === "string"
          ? node.params.params.color
          : "#ffffff",
      animations: node.params.animations,
      propertyPath: "color",
      localTime,
    }),
    backgroundColor: resolveColorAtTime({
      baseColor: background.color,
      animations: node.params.animations,
      propertyPath: "background.color",
      localTime,
    }),
    measuredText: measureTextElement({
      element: node.params,
      canvasHeight: node.params.canvasHeight,
      localTime,
      ctx: getTextMeasurementContext(),
    }),
  };
}

async function resolveBlurBackgroundNode({
  node,
  context,
}: {
  node: BlurBackgroundNode;
  context: ResolveContext;
}): Promise<ResolvedBlurBackgroundNodeState | null> {
  const clipTime = context.time - node.params.timeOffset;
  if (clipTime < 0 || clipTime >= node.params.duration) {
    return null;
  }

  const backdropSource = await resolveBackdropSource({ node, clipTime });
  if (!backdropSource) {
    return null;
  }

  return {
    backdropSource,
    passes: buildGaussianBlurPasses({
      sigmaX: intensityToSigma({
        intensity: node.params.blurIntensity,
        resolution: context.renderer.width,
        reference: 1920,
      }),
      sigmaY: intensityToSigma({
        intensity: node.params.blurIntensity,
        resolution: context.renderer.height,
        reference: 1080,
      }),
    }),
  };
}

async function resolveBackdropSource({
  node,
  clipTime,
}: {
  node: BlurBackgroundNode;
  clipTime: number;
}): Promise<BackdropSource | null> {
  if (node.params.mediaType === "video") {
    const sourceTimeTicks =
      node.params.trimStart +
      getSourceTimeAtClipTime({
        clipTime,
        retime: node.params.retime,
      });
    const frame = await videoCache.getFrameAt({
      mediaId: node.params.mediaId,
      file: node.params.file,
      time: mediaTimeToSeconds({
        time: roundMediaTime({ time: sourceTimeTicks }),
      }),
    });
    if (!frame) {
      return null;
    }

    return {
      source: frame.canvas,
      width: frame.canvas.width,
      height: frame.canvas.height,
    };
  }

  const source = await loadImageSource({ url: node.params.url });
  return {
    source: source.source,
    width: source.width,
    height: source.height,
  };
}
