"use client";
import { useEditorUI } from "@/react/ui-context";
import { type Styled, type Renderable, renderProps } from "./render-props";

import * as React from "react";
import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/ui";
import { useOverlayOpenChange } from "./use-overlay-open-change";

function DropdownMenu({
  open,
  onOpenChange,
  ...props
}: Omit<
  React.ComponentProps<typeof DropdownMenuPrimitive.Root>,
  "onOpenChange"
> & { onOpenChange?: (open: boolean) => void }) {
  const handleOpenChange = useOverlayOpenChange({
    open,
    onOpenChange,
  });
  return (
    <DropdownMenuPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  Renderable<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
  >
>((props, ref) => (
  <DropdownMenuPrimitive.Trigger {...renderProps(props)} ref={ref} />
));

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = (
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>,
) => (
  <DropdownMenuPrimitive.Portal
    container={useEditorUI().portalContainer}
    {...props}
  />
);

const DropdownMenuSub = DropdownMenuPrimitive.SubmenuRoot;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const dropdownMenuItemVariants = cva(
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

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubmenuTrigger>,
  Styled<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubmenuTrigger>
  > & {
    inset?: boolean;
    variant?: VariantProps<typeof dropdownMenuItemVariants>["variant"];
  }
>(({ className, inset, children, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.SubmenuTrigger
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ variant }),
      "data-open:bg-muted data-open:text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubmenuTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Popup>,
  Styled<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup>>
>(({ className, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Positioner
      side="right"
      align="start"
      sideOffset={4}
      className="bve-overlay-layer"
    >
      <DropdownMenuPrimitive.Popup
        ref={ref}
        className={cn(
          "group/menu bve-overlay bve-menu-surface z-overlay min-w-32 overflow-hidden ",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Positioner>
  </DropdownMenuPortal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Popup>,
  Styled<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup>> &
    Pick<
      DropdownMenuPrimitive.Positioner.Props,
      "side" | "align" | "sideOffset"
    >
>(({ className, sideOffset = 4, side, align, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Positioner
      side={side}
      align={align}
      sideOffset={sideOffset}
      className="bve-overlay-layer"
    >
      <DropdownMenuPrimitive.Popup
        ref={ref}
        className={cn(
          "group/menu bve-overlay bve-menu-surface z-overlay min-w-32 overflow-hidden ",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Positioner>
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  Renderable<
    Styled<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>
  > & {
    inset?: boolean;
    icon?: React.ReactNode;
    variant?: VariantProps<typeof dropdownMenuItemVariants>["variant"];
  }
>(
  (
    {
      className,
      inset,
      icon,
      variant = "default",
      children,
      asChild,
      ...props
    },
    ref,
  ) => {
    const iconSlot = (
      <span className="hidden size-4 shrink-0 items-center justify-center group-has-data-has-icon/menu:flex">
        {icon}
      </span>
    );

    const renderedChildren =
      asChild && React.isValidElement(children) ? (
        React.cloneElement(
          children as React.ReactElement<{ children?: React.ReactNode }>,
          {},
          iconSlot,
          (children as React.ReactElement<{ children?: React.ReactNode }>).props
            .children,
        )
      ) : (
        <>
          {iconSlot}
          {children}
        </>
      );

    return (
      <DropdownMenuPrimitive.Item
        ref={ref}
        render={asChild ? (renderedChildren as React.ReactElement) : undefined}
        data-has-icon={icon ? "" : undefined}
        className={cn(
          dropdownMenuItemVariants({ variant }),
          inset && "pl-8",
          className,
        )}
        {...props}
      >
        {asChild ? undefined : renderedChildren}
      </DropdownMenuPrimitive.Item>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  Styled<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
  > & {
    variant?: VariantProps<typeof dropdownMenuItemVariants>["variant"];
  }
>(({ className, children, checked, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ variant }),
      "pr-8 pl-2",
      className,
    )}
    checked={checked}
    closeOnClick={false}
    {...props}
  >
    {children}
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.CheckboxItemIndicator>
        <Check className="size-4" />
      </DropdownMenuPrimitive.CheckboxItemIndicator>
    </span>
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  Styled<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
  > & {
    variant?: VariantProps<typeof dropdownMenuItemVariants>["variant"];
  }
>(({ className, children, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ variant }),
      "pr-2 pl-8",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.RadioItemIndicator>
        <Circle className="size-2 fill-current" />
      </DropdownMenuPrimitive.RadioItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.GroupLabel>,
  Styled<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.GroupLabel>
  > & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "px-2 pb-1 pt-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  Styled<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("bg-border mx-1 my-1.5 h-px", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
