"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/* ─── Types ── */

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
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
};

/* ─── Component ── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : "button"}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
