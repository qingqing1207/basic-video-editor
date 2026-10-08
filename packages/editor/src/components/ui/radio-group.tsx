"use client";

import * as React from "react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { type Styled } from "./render-props";
import { Circle } from "lucide-react";

import { cn } from "@/utils/ui";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof BaseRadioGroup>,
  Omit<
    Styled<React.ComponentPropsWithoutRef<typeof BaseRadioGroup>>,
    "onValueChange"
  > & { onValueChange?: (value: string) => void }
>(({ className, onValueChange, ...props }, ref) => {
  return (
    <BaseRadioGroup
      onValueChange={(value) => {
        if (typeof value === "string") onValueChange?.(value);
      }}
      className={cn("grid bve-field-gap", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof Radio.Root>,
  Styled<React.ComponentPropsWithoutRef<typeof Radio.Root>>
>(({ className, ...props }, ref) => {
  return (
    <Radio.Root
      ref={ref}
      className={cn(
        "bve-control border-primary text-primary focus-visible:ring-ring aspect-square size-4 rounded-full border focus:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-[var(--bve-disabled-opacity)]",
        className,
      )}
      {...props}
    >
      <Radio.Indicator className="flex items-center justify-center">
        <Circle className="fill-primary size-3.5" />
      </Radio.Indicator>
    </Radio.Root>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
