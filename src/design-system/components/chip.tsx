"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

/* ─── Types ── */

type Variant = "default" | "accent" | "success" | "warning" | "error";
type Size = "sm" | "md";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  startContent?: ReactNode;
  onClose?: () => void;
}

/* ─── Styles ── */

const variants: Record<Variant, string> = {
  default: "bg-[var(--border-subtle)] text-[var(--ink-secondary)]",
  accent: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  success: "bg-[color-mix(in_oklch,var(--success),transparent_85%)] text-[var(--success)]",
  warning: "bg-[color-mix(in_oklch,var(--warning),transparent_85%)] text-[var(--warning)]",
  error: "bg-[color-mix(in_oklch,var(--error),transparent_85%)] text-[var(--error)]",
};

const sizes: Record<Size, string> = {
  sm: "h-5 px-2 text-[var(--text-micro)] gap-1",
  md: "h-6 px-2.5 text-[var(--text-caption)] gap-1.5",
};

/* ─── Component ── */

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  (
    { variant = "default", size = "sm", startContent, onClose, className, children, ...props },
    ref,
  ) => (
    <span
      ref={ref}
      className={[
        "inline-flex items-center rounded-[var(--radius-full)] font-medium whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {startContent}
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
          </svg>
        </button>
      )}
    </span>
  ),
);

Chip.displayName = "Chip";
