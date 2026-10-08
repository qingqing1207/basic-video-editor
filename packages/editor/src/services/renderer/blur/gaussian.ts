import type { BlurPass } from "./types";

const MAX_SINGLE_PASS_SIGMA = 10;
const MAX_STEP = 4;
const MAX_EFFECTIVE_SIGMA = MAX_SINGLE_PASS_SIGMA * MAX_STEP;
const MAX_ITERATIONS = 8;

export function buildGaussianBlurPasses({
  sigmaX,
  sigmaY,
}: {
  sigmaX: number;
  sigmaY: number;
}): BlurPass[] {
  const maxSigma = Math.max(sigmaX, sigmaY);
  if (maxSigma < 0.001) return [];

  const iterations = Math.min(
    MAX_ITERATIONS,
    Math.max(
      1,
      Math.ceil(
        (maxSigma * maxSigma) / (MAX_EFFECTIVE_SIGMA * MAX_EFFECTIVE_SIGMA),
      ),
    ),
  );
  const perPassSigmaX = sigmaX / Math.sqrt(iterations);
  const perPassSigmaY = sigmaY / Math.sqrt(iterations);
  const stepX = Math.max(1, perPassSigmaX / MAX_SINGLE_PASS_SIGMA);
  const stepY = Math.max(1, perPassSigmaY / MAX_SINGLE_PASS_SIGMA);

  const passes: BlurPass[] = [];
  for (let i = 0; i < iterations; i++) {
    passes.push({
      sigma: perPassSigmaX,
      step: stepX,
      direction: [1, 0],
    });
    passes.push({
      sigma: perPassSigmaY,
      step: stepY,
      direction: [0, 1],
    });
  }
  return passes;
}

export const INTENSITY_TO_SIGMA_DIVISOR = 5;

export function intensityToSigma({
  intensity,
  resolution,
  reference,
}: {
  intensity: number;
  resolution: number;
  reference: number;
}): number {
  return (intensity / INTENSITY_TO_SIGMA_DIVISOR) * (resolution / reference);
}
