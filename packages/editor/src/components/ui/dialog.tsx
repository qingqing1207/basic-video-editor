"use client";
import { useEditorUI } from "@/react/ui-context";
import {
  type Styled,
  type Renderable,
  renderProps,
  preventableFocus,
} from "./render-props";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/utils/ui";
import { useOverlayOpenChange } from "./use-overlay-open-change";

function Dialog({
  open,
  onOpenChange,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Root>, "onOpenChange"> & {
  onOpenChange?: (open: boolean) => void;
}) {
  const handleOpenChange = useOverlayOpenChange({
    open,
    onOpenChange,
  });
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  Renderable<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>>
>((props, ref) => (
  <DialogPrimitive.Trigger {...renderProps(props)} ref={ref} />
));

const DialogPortal = (
  props: React.ComponentProps<typeof DialogPrimitive.Portal>,
) => (
  <DialogPrimitive.Portal
    container={useEditorUI().portalContainer}
    {...props}
  />
);

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  Renderable<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>>
>((props, ref) => <DialogPrimitive.Close {...renderProps(props)} ref={ref} />);

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Backdrop>,
  Styled<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn("fixed inset-0 bve-overlay-layer bve-backdrop", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Popup>,
  Styled<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>> & {
    onCloseAutoFocus?: (event: Event) => void;
    onOpenAutoFocus?: (event: Event) => void;
  }
>(
  (
    { className, children, onCloseAutoFocus, onOpenAutoFocus, ...props },
    ref,
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={ref}
        className={cn(
          "bve-overlay bve-dialog fixed top-[50%] left-[50%] bve-overlay-layer grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] ",
          className,
        )}
        finalFocus={preventableFocus(onCloseAutoFocus)}
        initialFocus={preventableFocus(onOpenAutoFocus)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-open:bg-accent data-open:text-muted-foreground absolute top-6 right-6 cursor-pointer opacity-70 hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <X className="size-5 text-muted-foreground" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  ),
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-left border-b bve-dialog-spacing",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("bve-dialog-spacing flex flex-col", className)}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex gap-3 flex-col-reverse sm:flex-row sm:justify-end bve-dialog-spacing border-t",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  Styled<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg leading-none font-semibold tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  Styled<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
