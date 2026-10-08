import * as React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/ui";

const buttonVariants = cva(
  "bve-control bve-button inline-flex items-center cursor-pointer justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-[var(--bve-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bve-button-primary",
        primary: "bve-button-primary",
        neutral: "bg-foreground text-background hover:bg-foreground/90",
        background: "bg-background text-foreground hover:bg-background/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        "destructive-foreground":
          "border bg-background hover:bg-destructive/15 text-destructive",
        caution: "text-caution hover:bg-caution/10",
        outline:
          "bve-button-tool border border-border bg-background hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border",
        text: "bg-transparent rounded-none opacity-100 hover:opacity-75",
        ghost: "bve-button-tool bg-transparent hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline !p-0 !h-auto",
      },
      size: {
        default: "bve-size-default",
        sm: "bve-size-sm",
        md: "bve-size-md",
        lg: "bve-size-lg",
        icon: "bve-size-icon",
        text: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const renderedChild = asChild
      ? (React.Children.only(children) as React.ReactElement)
      : undefined;
    const effectiveSize = size ?? (variant === "text" ? "text" : "default");
    return (
      <BaseButton
        render={renderedChild}
        nativeButton={!asChild || renderedChild?.type === "button"}
        className={cn(
          buttonVariants({ variant, size: effectiveSize, className }),
        )}
        ref={ref}
        type="button"
        {...props}
      >
        {asChild ? undefined : children}
      </BaseButton>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
