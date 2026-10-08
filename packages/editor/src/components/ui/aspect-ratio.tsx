import * as React from "react";
export function AspectRatio({
  ratio = 1,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ratio?: number }) {
  return <div {...props} style={{ ...style, aspectRatio: ratio }} />;
}
