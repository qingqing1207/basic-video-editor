"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/utils/ui";

type TabsVariant = "default" | "underline";

const TabsVariantContext = React.createContext<TabsVariant>("default");

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
    "className"
  > & { className?: string } & {
    variant?: TabsVariant;
  }
>(({ variant = "default", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.Root ref={ref} {...props} />
  </TabsVariantContext.Provider>
));
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    "className"
  > & { className?: string }
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "text-muted-foreground inline-flex h-auto items-center gap-0 bg-transparent p-0",
        variant === "default" && "rounded-overlay",
        variant === "underline" && "border-b border-border w-full gap-0 px-2",
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Tab>,
  Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>,
    "className"
  > & { className?: string }
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Tab
      ref={ref}
      className={cn(
        "bve-control ring-offset-background focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-[var(--bve-disabled-opacity)]",
        variant === "default" &&
          "border border-transparent data-active:bg-secondary data-active:border-secondary-border data-active:text-secondary-foreground bve-size-sm",
        variant === "underline" &&
          "text-muted-foreground data-active:text-primary border-x-0 border-t-0 border-b-2 border-transparent data-active:border-primary rounded-none px-3 py-2 -mb-px",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Panel>,
  Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>,
    "className"
  > & { className?: string }
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Panel
      ref={ref}
      className={cn(
        "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
        variant === "underline" && "px-4",
        className,
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
