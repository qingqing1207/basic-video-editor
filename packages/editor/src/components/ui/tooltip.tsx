import { useEditorUI } from "@/react/ui-context";
import {
  type Styled,
  type Renderable,
  renderProps,
  preventableFocus,
} from "./render-props";
import { cva, type VariantProps } from "class-variance-authority";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/utils/ui";

const TooltipProvider = ({
  delayDuration,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
  delayDuration?: number;
}) => <TooltipPrimitive.Provider delay={delayDuration} {...props} />;

const Tooltip = ({
  delayDuration,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
  delayDuration?: number;
}) => (
  <TooltipPrimitive.Provider delay={delayDuration}>
    <TooltipPrimitive.Root {...props} />
  </TooltipPrimitive.Provider>
);

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  Renderable<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>>
>((props, ref) => (
  <TooltipPrimitive.Trigger {...renderProps(props)} ref={ref} />
));

const tooltipVariants = cva("bve-overlay z-overlay overflow-visible text-sm", {
  variants: {
    variant: {
      default: "bg-popover text-popover-foreground border px-3 py-1.5",
      destructive:
        "bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive [border-width:0.5px]",
      outline: "border-border",
      important:
        "bg-caution/10 text-caution border-caution [border-width:0.5px]",
      promotions:
        "bg-destructive/10 text-destructive border-destructive [border-width:0.5px]",
      personal:
        "bg-constructive/10 text-constructive border-constructive [border-width:0.5px]",
      updates: "bg-primary/10 text-primary border-primary [border-width:0.5px]",
      forums: "bg-primary/10 text-primary border-primary [border-width:0.5px]",
      sidebar: "bg-popover p-2.5 flex flex-col gap-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type TooltipContentProps = Styled<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup>
> &
  VariantProps<typeof tooltipVariants> &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "align" | "sideOffset">;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Popup>,
  TooltipContentProps
>(({ className, sideOffset = 4, side, align, variant, ...props }, ref) => (
  <TooltipPrimitive.Portal container={useEditorUI().portalContainer}>
    <TooltipPrimitive.Positioner
      side={side}
      align={align}
      sideOffset={sideOffset}
      className="bve-overlay-layer"
    >
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(tooltipVariants({ variant }), className)}
        {...props}
      >
        {variant === "sidebar" && (
          <svg
            width="6"
            height="10"
            viewBox="0 0 6 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-1/2 left-[-6px] -translate-y-1/2"
            aria-hidden="true"
          >
            <path d="M6 0L0 5L6 10V0Z" className="fill-popover" />
          </svg>
        )}
        {props.children}
      </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
