import type {
  AnimationInterpolation,
  AnimationPath,
  NumericSpec,
} from "@/animation/types";
import {
  coerceParamValue,
  getParamDefaultInterpolation,
  getParamChannelLayout,
  getParamNumericRange,
  type ParamChannelLayout,
  type ParamDefinition,
  type ParamValue,
  type ParamValues,
} from "@/params";
import { getElementParam } from "@/params/registry";
import type { TimelineElement } from "@/timeline";
import { isVisualElement } from "@/timeline/element-utils";

export interface AnimationPathDescriptor {
  channelLayout: ParamChannelLayout;
  defaultInterpolation: AnimationInterpolation;
  numericRanges?: Partial<Record<string, NumericSpec>>;
  coerceValue: ({ value }: { value: ParamValue }) => ParamValue | null;
  getBaseValue: () => ParamValue | null;
  setBaseValue: ({ value }: { value: ParamValue }) => TimelineElement;
}

// Leaf params expose a single component named "value". Composite params don't
// carry numeric ranges yet — revisit when one does.
function paramNumericRanges({
  param,
}: {
  param: ParamDefinition;
}): Partial<Record<string, NumericSpec>> | undefined {
  const range = getParamNumericRange({ param });
  return range ? { value: range } : undefined;
}

function buildParamDescriptor({
  param,
  baseParams,
  setParams,
}: {
  param: ParamDefinition;
  baseParams: ParamValues;
  setParams: (params: ParamValues) => TimelineElement;
}): AnimationPathDescriptor | null {
  if (param.keyframable === false) {
    return null;
  }

  return {
    channelLayout: getParamChannelLayout({ param }),
    defaultInterpolation: getParamDefaultInterpolation({ param }),
    numericRanges: paramNumericRanges({ param }),
    coerceValue: ({ value }) => coerceParamValue({ param, value }),
    getBaseValue: () => baseParams[param.key] ?? param.default,
    setBaseValue: ({ value }) => {
      const coercedValue = coerceParamValue({ param, value });
      if (coercedValue === null) {
        return setParams(baseParams);
      }

      return setParams({
        ...baseParams,
        [param.key]: coercedValue,
      });
    },
  };
}

function buildElementParamDescriptor({
  element,
  paramKey,
}: {
  element: TimelineElement;
  paramKey: string;
}): AnimationPathDescriptor | null {
  const param = getElementParam({ element, key: paramKey });
  if (!param) {
    return null;
  }

  return buildParamDescriptor({
    param,
    baseParams: element.params,
    setParams: (params) => ({
      ...element,
      params,
    }),
  });
}

export function resolveAnimationTarget({
  element,
  path,
}: {
  element: TimelineElement;
  path: AnimationPath;
}): AnimationPathDescriptor | null {
  return buildElementParamDescriptor({ element, paramKey: path });
}
