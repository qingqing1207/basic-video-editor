"use client";
import { useEditorUI } from "@/react/ui-context";
import { type Styled, type Renderable, renderProps } from "./render-props";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  ArrowRightIcon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { useOverlayOpenChange } from "./use-overlay-open-change";

function ContextMenu({
  onOpenChange,
  ...props
}: Omit<
  React.ComponentProps<typeof ContextMenuPrimitive.Root>,
  "onOpenChange"
> & { onOpenChange?: (open: boolean) => void }) {
  const handleOpenChange = useOverlayOpenChange({
    onOpenChange,
  });
  return (
    <ContextMenuPrimitive.Root onOpenChange={handleOpenChange} {...props} />
  );
}

const ContextMenuTrigger = React.forwardRef<
  HTMLDivElement,
  Renderable<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>
  >
>((props, ref) => (
  <ContextMenuPrimitive.Trigger {...renderProps(props)} ref={ref} />
));

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = (
  props: React.ComponentProps<typeof ContextMenuPrimitive.Portal>,
) => (
  <ContextMenuPrimitive.Portal
    container={useEditorUI().portalContainer}
    {...props}
  />
);

const ContextMenuSub = ContextMenuPrimitive.SubmenuRoot;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const contextMenuItemVariants = cva(
  "bve-menu-item relative flex cursor-pointer select-none items-center text-sm text-foreground/85 outline-hidden data-disabled:pointer-events-none data-disabled:opacity-[var(--bve-disabled-opacity)] [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "focus:bg-accent focus:text-accent-foreground [&_svg]:text-muted-foreground",
        destructive:
          "text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubmenuTrigger>,
  Styled<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubmenuTrigger>
  > & {
    inset?: boolean;
    variant?: VariantProps<typeof contextMenuItemVariants>["variant"];
    icon?: React.ReactNode;
  }
>(
  (
    { className, inset, children, variant = "default", icon, ...props },
    ref,
  ) => (
    <ContextMenuPrimitive.SubmenuTrigger
      ref={ref}
      className={cn(
        contextMenuItemVariants({ variant }),
        "data-open:bg-accent data-open:text-accent-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="size-4 shrink-0 text-muted-foreground">{icon}</span>
      )}
      {children}
      <HugeiconsIcon
        icon={ArrowRightIcon}
        className="ml-auto text-muted-foreground/80"
      />
    </ContextMenuPrimitive.SubmenuTrigger>
  ),
);
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Popup>,
  Styled<React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Popup>>
>(({ className, ...props }, ref) => (
  <ContextMenuPortal>
    <ContextMenuPrimitive.Positioner
      side="right"
      align="start"
      sideOffset={4}
      className="bve-overlay-layer"
    >
      <ContextMenuPrimitive.Popup
        ref={ref}
        className={cn(
          "bve-overlay bve-menu-surface z-overlay min-w-48 overflow-hidden ",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Positioner>
  </ContextMenuPortal>
));
ContextMenuSubContent.displayName = "ContextMenuSubContent";

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Popup>,
  Styled<React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Popup>> &
    Pick<
      ContextMenuPrimitive.Positioner.Props,
      "side" | "align" | "sideOffset"
    > & {
      container?: HTMLElement | null;
    }
>(({ className, container, side, align, sideOffset = 4, ...props }, ref) => (
  <ContextMenuPortal container={container ?? useEditorUI().portalContainer}>
    <ContextMenuPrimitive.Positioner
      side={side}
      align={align}
      sideOffset={sideOffset}
      className="bve-overlay-layer"
    >
      <ContextMenuPrimitive.Popup
        ref={ref}
        className={cn(
          "bve-overlay bve-menu-surface z-overlay min-w-48 overflow-hidden ",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Positioner>
  </ContextMenuPortal>
));
ContextMenuContent.displayName = "ContextMenuContent";

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  Renderable<
    Styled<React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>>
  > & {
    inset?: boolean;
    variant?: VariantProps<typeof contextMenuItemVariants>["variant"];
    icon?: React.ReactNode;
    textRight?: string;
  }
>(
  (
    {
      className,
      inset,
      variant = "default",
      icon,
      children,
      textRight,
      ...props
    },
    ref,
  ) => {
    const shouldInsetContent = inset || Boolean(icon);

    return (
      <ContextMenuPrimitive.Item
        ref={ref}
        className={cn(
          contextMenuItemVariants({ variant }),
          shouldInsetContent && "pl-8",
          className,
        )}
        {...props}
      >
        {icon && (
          <span className="absolute left-3 flex size-3.5 items-center justify-center text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
            {icon}
          </span>
        )}
        {children}
        {textRight && (
          <span className="ml-auto text-2xs tracking-widest text-muted-foreground/80 mb-0.5">
            {textRight}
          </span>
        )}
      </ContextMenuPrimitive.Item>
    );
  },
);
ContextMenuItem.displayName = "ContextMenuItem";

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  Styled<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
  > & {
    variant?: VariantProps<typeof contextMenuItemVariants>["variant"];
    icon?: React.ReactNode;
  }
>(
  (
    { className, children, checked, variant = "default", icon, ...props },
    ref,
  ) => (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        contextMenuItemVariants({ variant }),
        "pr-2 pl-8",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-3 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <HugeiconsIcon icon={Tick02Icon} className="size-4" />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {icon && (
        <span className="size-4 shrink-0 text-muted-foreground">{icon}</span>
      )}
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  ),
);
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  Styled<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
  > & {
    variant?: VariantProps<typeof contextMenuItemVariants>["variant"];
    icon?: React.ReactNode;
  }
>(({ className, children, variant = "default", icon, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(contextMenuItemVariants({ variant }), "pr-2 pl-8", className)}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <ContextMenuPrimitive.RadioItemIndicator>
        <HugeiconsIcon icon={CircleIcon} className="size-2 fill-current" />
      </ContextMenuPrimitive.RadioItemIndicator>
    </span>
    {icon && (
      <span className="size-4 shrink-0 text-muted-foreground">{icon}</span>
    )}
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.GroupLabel>,
  Styled<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.GroupLabel>
  > & {
    inset?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, inset, icon, children, ...props }, ref) => (
  <ContextMenuPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {icon && (
      <span className="size-4 shrink-0 text-muted-foreground">{icon}</span>
    )}
    {children}
  </ContextMenuPrimitive.GroupLabel>
));
ContextMenuLabel.displayName = "ContextMenuLabel";

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  Styled<React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("bg-border mx-1 my-1.5 h-px", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground opacity-60",
        className,
      )}
      {...props}
    />
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
