"use client";

import { type HTMLAttributes } from "react";

type Orientation = "horizontal" | "vertical";

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation;
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={[
        "shrink-0 bg-[var(--border)]",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
