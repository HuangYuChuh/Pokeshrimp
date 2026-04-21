"use client";

import { forwardRef, type HTMLAttributes } from "react";

/* ─── Card ── */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive, className, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]",
        "p-[var(--padding-card)]",
        interactive && "cursor-pointer transition-colors hover:bg-[var(--surface-raised)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
);

Card.displayName = "Card";

/* ─── CardHeader / CardContent — lightweight slots ── */

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center gap-[var(--gap-inline)] mb-[var(--gap-stack)] ${className ?? ""}`}
      {...props}
    />
  ),
);

CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`text-[var(--text-body-sm)] text-[var(--ink-secondary)] leading-[var(--leading-relaxed)] ${className ?? ""}`}
      {...props}
    />
  ),
);

CardContent.displayName = "CardContent";
