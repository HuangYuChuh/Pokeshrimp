"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

/* ─── Switch ──
 * Renders a <label> wrapping the hidden input + visual track.
 * Clicking anywhere on the track toggles the input.
 * Pass children for label text, or use aria-label for icon-only.
 * ────────────────────────────────────────────────────────── */

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  children?: React.ReactNode;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, children, ...props }, ref) => (
    <label
      className={`inline-flex items-center gap-[var(--gap-inline)] cursor-pointer ${className ?? ""}`}
    >
      <input ref={ref} type="checkbox" role="switch" className="sr-only peer" {...props} />
      <span
        className={[
          "relative w-9 h-5 rounded-[var(--radius-full)]",
          "bg-[var(--border-strong)] peer-checked:bg-[var(--accent)]",
          "transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2",
          "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
          "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
          "after:w-4 after:h-4 after:rounded-full after:bg-[var(--canvas-invert)]",
          "after:transition-transform peer-checked:after:translate-x-4",
        ].join(" ")}
      />
      {children && <span className="text-[var(--text-body-sm)] text-[var(--ink)]">{children}</span>}
    </label>
  ),
);

Switch.displayName = "Switch";
