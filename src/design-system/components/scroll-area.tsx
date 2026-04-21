"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

/* ─── ScrollArea ── */

export const ScrollArea = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={`relative overflow-hidden ${className ?? ""}`}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = "ScrollArea";

/* ─── ScrollBar ── */

const ScrollBar = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={[
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-1.5 border-l border-l-transparent p-px",
      orientation === "horizontal" && "h-1.5 flex-col border-t border-t-transparent p-px",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-[var(--radius-full)] bg-[var(--border)]" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

ScrollBar.displayName = "ScrollBar";
