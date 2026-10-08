"use client";
import * as React from "react";
import { Popover as Base } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
import { useEditorUI } from "@/react/ui-context";
import { cn } from "@/utils/ui";
import {
  type Styled,
  type Renderable,
  renderProps,
  preventableFocus,
} from "./render-props";
import { useOverlayOpenChange } from "./use-overlay-open-change";
const PositionContext = React.createContext<{
  anchor: HTMLElement | null;
  setAnchor: (node: HTMLElement | null) => void;
  outside: React.MutableRefObject<((event: Event) => void) | undefined>;
} | null>(null);
export function Popover({
  open,
  onOpenChange,
  ...props
}: Omit<Base.Root.Props, "onOpenChange"> & {
  onOpenChange?: (open: boolean) => void;
}) {
  const handleChange = useOverlayOpenChange({ open, onOpenChange });
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const outside = React.useRef<((event: Event) => void) | undefined>(undefined);
  return (
    <PositionContext.Provider value={{ anchor, setAnchor, outside }}>
      <Base.Root
        open={open}
        onOpenChange={(next, details) => {
          if (
            !next &&
            (details.reason === "outside-press" ||
              details.reason === "focus-out")
          ) {
            const event = new Event("outside", { cancelable: true });
            outside.current?.(event);
            if (event.defaultPrevented) {
              details.cancel();
              return;
            }
          }
          handleChange(next);
        }}
        {...props}
      />
    </PositionContext.Provider>
  );
}
export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  Renderable<Base.Trigger.Props>
>((props, ref) => <Base.Trigger {...renderProps(props)} ref={ref} />);
export const PopoverClose = React.forwardRef<
  HTMLButtonElement,
  Renderable<Base.Close.Props>
>((props, ref) => <Base.Close {...renderProps(props)} ref={ref} />);
export const PopoverAnchor = React.forwardRef<
  HTMLElement,
  Renderable<React.HTMLAttributes<HTMLElement>>
>(({ asChild, children, ...props }, ref) => {
  const context = React.useContext(PositionContext)!;
  return useRender({
    defaultTagName: "div",
    render: asChild
      ? (React.Children.only(children) as React.ReactElement)
      : undefined,
    ref: [ref, context.setAnchor],
    props: { ...props, ...(!asChild ? { children } : {}) },
  });
});
type ContentProps = Styled<Base.Popup.Props> &
  Pick<
    Base.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset"
  > & {
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    onInteractOutside?: (event: Event) => void;
  };
export const PopoverContent = React.forwardRef<HTMLDivElement, ContentProps>(
  (
    {
      className,
      align = "center",
      sideOffset = 4,
      side,
      alignOffset,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    const context = React.useContext(PositionContext)!;
    React.useEffect(() => {
      context.outside.current = onInteractOutside;
      return () => {
        context.outside.current = undefined;
      };
    }, [context.outside, onInteractOutside]);
    return (
      <Base.Portal container={useEditorUI().portalContainer}>
        <Base.Positioner
          anchor={context.anchor ?? undefined}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="bve-overlay-layer"
        >
          <Base.Popup
            ref={ref}
            initialFocus={preventableFocus(onOpenAutoFocus)}
            finalFocus={preventableFocus(onCloseAutoFocus)}
            className={cn(
              "bve-overlay bve-panel-spacing z-overlay w-72 outline-hidden",
              className,
            )}
            {...props}
          />
        </Base.Positioner>
      </Base.Portal>
    );
  },
);
