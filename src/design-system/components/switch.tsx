"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

/* ─── Switch ── */

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role">;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <label className={`inline-flex items-center cursor-pointer ${className ?? ""}`}>
    <input ref={ref} type="checkbox" role="switch" className="sr-only peer" {...props} />
    <div
      className={[
        "relative w-9 h-5 rounded-[var(--radius-full)]",
        "bg-[var(--border-strong)] peer-checked:bg-[var(--accent)]",
        "transition-colors",
        "peer-focus-visible:ring-1 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2",
        "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
        "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
        "after:w-4 after:h-4 after:rounded-full after:bg-white",
        "after:transition-transform peer-checked:after:translate-x-4",
      ].join(" ")}
    />
  </label>
));

Switch.displayName = "Switch";
