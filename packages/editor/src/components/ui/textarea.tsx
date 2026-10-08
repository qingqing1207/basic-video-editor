import * as React from "react";

import { cn } from "@/utils/ui";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "bve-control bve-field file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-[60px] w-full bve-panel-spacing resize-none text-base outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[var(--bve-disabled-opacity)] md:text-sm",
        "focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-primary/10",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
