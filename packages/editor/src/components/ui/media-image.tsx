import type { ImgHTMLAttributes } from "react";
export default function MediaImage({
  fill,
  unoptimized,
  priority,
  style,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  unoptimized?: boolean;
  priority?: boolean;
}) {
  return (
    <img
      {...props}
      loading={priority ? "eager" : props.loading}
      style={
        fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              ...style,
            }
          : style
      }
    />
  );
}
