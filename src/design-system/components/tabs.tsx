"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

/* ─── Root ── */

export const Tabs = TabsPrimitive.Root;

/* ─── TabsList ── */

export const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={["flex items-center gap-1 border-b border-[var(--border)]", className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));

TabsList.displayName = "TabsList";

/* ─── TabsTrigger ── */

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={[
      "px-3 py-2 text-[var(--text-body-sm)] font-medium",
      "text-[var(--ink-secondary)] hover:text-[var(--ink)]",
      "border-b-2 border-transparent -mb-px",
      "data-[state=active]:text-[var(--ink)] data-[state=active]:border-[var(--accent)]",
      "transition-colors outline-none",
      "focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));

TabsTrigger.displayName = "TabsTrigger";

/* ─── TabsContent ── */

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={[
      "mt-[var(--space-4)] outline-none",
      "focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));

TabsContent.displayName = "TabsContent";
