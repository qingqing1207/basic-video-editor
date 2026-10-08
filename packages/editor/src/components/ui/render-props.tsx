import * as React from "react";
export type Styled<P> = Omit<P, "className"> & { className?: string };
export type Renderable<P> = P & { asChild?: boolean };
/** Maps the copied editor's composition API to Base UI's render API. */
export function renderProps<
  P extends { children?: React.ReactNode; asChild?: boolean },
>(props: P) {
  const { asChild, children, ...rest } = props;
  return asChild
    ? { ...rest, render: React.Children.only(children) as React.ReactElement }
    : { ...rest, children };
}
export function preventableFocus(
  handler?: (event: Event) => void,
  fallback = true,
) {
  return () => {
    const event = new Event("editor-focus", { cancelable: true });
    handler?.(event);
    return event.defaultPrevented ? false : fallback;
  };
}
