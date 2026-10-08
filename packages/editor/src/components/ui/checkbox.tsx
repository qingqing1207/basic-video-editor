"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/utils/ui";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    "className"
  > & { className?: string }
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "cursor-default bg-background bve-control peer focus-visible:ring-ring data-checked:bg-primary data-checked:text-primary-foreground data-checked:border-primary size-4 shrink-0 rounded-sm border focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-[var(--bve-disabled-opacity)]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="size-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
