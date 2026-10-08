"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/utils/ui";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  Omit<
    SliderPrimitive.Root.Props<number[]>,
    "className" | "onValueCommitted"
  > & { onValueCommit?: (value: number[]) => void } & {
    className?: string;
  }
>(
  (
    { className, value, defaultValue, onValueChange, onValueCommit, ...props },
    ref,
  ) => (
    <SliderPrimitive.Root
      ref={ref}
      // Base UI's single-thumb pointer path uses a scalar. Keep the public
      // array-based API used by the original editor for both pointer and keys.
      value={value?.length === 1 ? value[0] : value}
      defaultValue={defaultValue?.length === 1 ? defaultValue[0] : defaultValue}
      onValueChange={(next, details) =>
        onValueChange?.(Array.isArray(next) ? next : [next], details)
      }
      onValueCommitted={(next) =>
        onValueCommit?.(Array.isArray(next) ? next : [next])
      }
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="bg-accent relative h-[var(--bve-slider-track-size)] w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={props["aria-label"]}
          className="bve-control border-primary/50 bg-background focus-visible:ring-ring block size-[var(--bve-slider-thumb-size)] rounded-full border focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-[var(--bve-disabled-opacity)]"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = "Slider";

export { Slider };
