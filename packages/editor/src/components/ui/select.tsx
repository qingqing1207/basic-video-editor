"use client";
import { useEditorUI } from "@/react/ui-context";
import {
  type Styled,
  type Renderable,
  renderProps,
  preventableFocus,
} from "./render-props";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check } from "lucide-react";
import { ArrowUpIcon, ArrowDownIcon } from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { useOverlayOpenChange } from "./use-overlay-open-change";

function Select({
  open,
  onOpenChange,
  onValueChange,
  children,
  items,
  ...props
}: Omit<
  SelectPrimitive.Root.Props<string, false>,
  "onValueChange" | "onOpenChange"
> & {
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const handleOpenChange = useOverlayOpenChange({
    open,
    onOpenChange,
  });
  return (
    <SelectPrimitive.Root
      open={open}
      items={items ?? collectSelectItems(children)}
      onValueChange={(value) => {
        if (value !== null) onValueChange?.(value);
      }}
      onOpenChange={handleOpenChange}
      {...props}
    >
      {children}
    </SelectPrimitive.Root>
  );
}

function collectSelectItems(
  children: React.ReactNode,
): { value: string; label: React.ReactNode }[] {
  const items: { value: string; label: React.ReactNode }[] = [];
  React.Children.forEach(children, (child) => {
    if (
      !React.isValidElement<{ value?: string; children?: React.ReactNode }>(
        child,
      )
    )
      return;
    if (child.type === SelectItem && typeof child.props.value === "string")
      items.push({ value: child.props.value, label: child.props.children });
    else if (child.props.children)
      items.push(...collectSelectItems(child.props.children));
  });
  return items;
}

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const selectItemVariants = cva(
  "bve-menu-item relative flex cursor-pointer select-none items-center  text-sm text-foreground/85 outline-hidden data-disabled:pointer-events-none data-disabled:opacity-[var(--bve-disabled-opacity)] [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "text-destructive data-[highlighted]:bg-destructive/5 data-[highlighted]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const selectTriggerVariants = cva(
  "bve-control bve-field bve-size-sm ring-offset-background placeholder:text-muted-foreground flex w-auto cursor-pointer items-center justify-between gap-1 text-sm whitespace-nowrap transition-none focus:border-primary focus:ring-0 focus:ring-primary/10 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-[var(--bve-disabled-opacity)] [&>span]:line-clamp-1",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-background hover:bg-accent/50",
      },
      size: {
        default: "",
        sm: "rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>> &
    VariantProps<typeof selectTriggerVariants> & {
      icon?: React.ReactNode;
    }
>(({ className, children, icon, variant, size, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ variant, size }), className)}
    {...props}
  >
    <div className="flex items-center gap-1.5">
      {icon && (
        <span className="text-muted-foreground [&_svg]:size-3.5 shrink-0">
          {icon}
        </span>
      )}
      {children}
    </div>
    <SelectPrimitive.Icon>
      <HugeiconsIcon icon={ArrowDownIcon} className="size-4" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpArrow>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpArrow>>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpArrow
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <HugeiconsIcon icon={ArrowUpIcon} className="size-4" />
  </SelectPrimitive.ScrollUpArrow>
));
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownArrow>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownArrow>>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownArrow
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <HugeiconsIcon icon={ArrowDownIcon} className="size-4" />
  </SelectPrimitive.ScrollDownArrow>
));
SelectScrollDownButton.displayName = "SelectScrollDownButton";

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Popup>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup>> &
    Pick<SelectPrimitive.Positioner.Props, "side" | "align" | "sideOffset"> & {
      position?: "popper" | "item-aligned";
    }
>(
  (
    {
      className,
      children,
      position = "popper",
      side,
      align,
      sideOffset = 4,
      ...props
    },
    ref,
  ) => (
    <SelectPrimitive.Portal container={useEditorUI().portalContainer}>
      <SelectPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={position === "item-aligned"}
        className="bve-overlay-layer"
      >
        <SelectPrimitive.Popup
          ref={ref}
          className={cn(
            "bve-overlay bve-menu-surface z-overlay max-h-(--available-height) min-w-32 overflow-hidden ",
            className,
          )}
            {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List
            className={cn(
              position === "popper" && "w-full min-w-(--anchor-width)",
            )}
          >
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.GroupLabel>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "px-2 pb-1 pt-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>> & {
    variant?: VariantProps<typeof selectItemVariants>["variant"];
  }
>(({ className, children, variant = "default", ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants({ variant }), "pl-6 pr-2", className)}
    {...props}
  >
    <span className="absolute left-1.5 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  Styled<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("bg-border mx-1 my-1 h-px", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
