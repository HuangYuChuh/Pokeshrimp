"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { forwardRef, type ReactNode } from "react";

/* ─── Provider (wrap once at app root) ── */

export const TooltipProvider = TooltipPrimitive.Provider;

/* ─── Tooltip ── */

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/* ─── TooltipContent ── */

interface TooltipContentProps {
  children: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, className, side = "top", sideOffset = 6 }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        className={[
          "z-50",
          "rounded-[var(--radius-sm)] bg-[var(--canvas-invert)] px-2.5 py-1.5",
          "text-[var(--text-caption)] text-[var(--canvas)]",
          "shadow-[var(--shadow-sm)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  ),
);

TooltipContent.displayName = "TooltipContent";
