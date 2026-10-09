"use client";

import * as React from "react";
import { Switch as SwitchPrimitives } from "@base-ui/react/switch";

import { cn } from "@/utils/ui";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    "className"
  > & { className?: string }
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "bve-control peer focus-visible:ring-ring focus-visible:ring-offset-background data-checked:bg-primary data-unchecked:bg-muted inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-[var(--bve-disabled-opacity)]",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "data-checked:bg-primary-foreground data-unchecked:bg-on-media pointer-events-none block size-4 rounded-full ring-0 data-checked:translate-x-4 data-unchecked:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = "Switch";

export { Switch };
