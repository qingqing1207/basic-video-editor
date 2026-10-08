import { cn } from "@/utils/ui";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-primary/10 animate-pulse rounded-control", className)}
      {...props}
    />
  );
}

export { Skeleton };
