"use client";

import { forwardRef, type HTMLAttributes } from "react";

/* ─── Types ── */

type Variant = "default" | "accent" | "success" | "warning" | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

/* ─── Styles ── */

const base = [
  "inline-flex items-center gap-1 px-2 py-0.5",
  "rounded-[var(--radius-full)]",
  "text-[var(--text-micro)] font-medium leading-none whitespace-nowrap",
].join(" ");

const variants: Record<Variant, string> = {
  default: "bg-[var(--border-subtle)] text-[var(--ink-secondary)]",
  accent: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  success: "bg-[color-mix(in_oklch,var(--success),transparent_85%)] text-[var(--success)]",
  warning: "bg-[color-mix(in_oklch,var(--warning),transparent_85%)] text-[var(--warning)]",
  error: "bg-[color-mix(in_oklch,var(--error),transparent_85%)] text-[var(--error)]",
};

/* ─── Component ── */

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <span ref={ref} className={`${base} ${variants[variant]} ${className ?? ""}`} {...props} />
  ),
);

Badge.displayName = "Badge";
