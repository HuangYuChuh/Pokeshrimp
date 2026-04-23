"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/* ─── Types ── */

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "icon-sm" | "icon-md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

/* ─── Styles ── */

const base = [
  "inline-flex items-center justify-center gap-[var(--gap-inline)]",
  "font-medium whitespace-nowrap select-none",
  "transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
  "disabled:opacity-50 disabled:pointer-events-none",
].join(" ");

const variants: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--border-subtle)]",
  outline: "border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--border-subtle)]",
  danger: "bg-[var(--error)] text-white hover:opacity-90 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-3 text-[var(--text-body-sm)] rounded-[var(--radius-md)]",
  md: "h-9 px-4 text-[var(--text-body)] rounded-[var(--radius-md)]",
  "icon-sm": "h-7 w-7 p-0 rounded-[var(--radius-md)]",
  "icon-md": "h-9 w-9 p-0 rounded-[var(--radius-md)]",
};

/* ─── Spinner ── */

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="8" cy="8" r="6" className="opacity-25" />
      <path d="M8 2a6 6 0 0 1 6 6" className="opacity-75" />
    </svg>
  );
}

/* ─── Component ── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, asChild, className, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : "button"}
        disabled={isDisabled}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </Comp>
    );
  },
);

Button.displayName = "Button";
