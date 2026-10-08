"use client";

import * as React from "react";
import { Separator as BaseSeparator } from "@base-ui/react/separator";

import { cn } from "@/utils/ui";

const Separator = React.forwardRef<
  React.ElementRef<typeof BaseSeparator>,
  Omit<React.ComponentPropsWithoutRef<typeof BaseSeparator>, "className"> & {
    className?: string;
    decorative?: boolean;
  }
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => (
    <BaseSeparator
      ref={ref}
      role={decorative ? "presentation" : "separator"}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = "Separator";

export { Separator };
