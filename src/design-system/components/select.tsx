"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { forwardRef } from "react";

/* ─── Select ──
 * Built on @radix-ui/react-select for correct listbox semantics,
 * hidden input for forms, and full keyboard navigation.
 * ────────────────────────────────────────────────────────── */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, onChange, placeholder = "Select...", className, disabled }, ref) => (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        ref={ref}
        className={[
          "inline-flex items-center justify-between gap-2",
          "w-full h-9 px-3 rounded-[var(--radius-md)]",
          "border border-[var(--border)] bg-[var(--surface)]",
          "text-[var(--text-body-sm)] text-[var(--ink)]",
          "hover:border-[var(--border-strong)] transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
          "disabled:opacity-50 disabled:pointer-events-none",
          "data-[placeholder]:text-[var(--ink-ghost)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={[
            "z-[var(--z-dropdown)]",
            "max-h-[240px] overflow-y-auto",
            "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]",
            "p-1 shadow-[var(--shadow-sm)]",
          ].join(" ")}
        >
          <SelectPrimitive.Viewport>
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={[
                  "flex items-center px-2 py-1.5",
                  "rounded-[var(--radius-sm)] text-[var(--text-body-sm)] text-[var(--ink)]",
                  "cursor-pointer select-none outline-none",
                  "data-[highlighted]:bg-[var(--accent-subtle)] data-[highlighted]:text-[var(--accent)]",
                  "data-[state=checked]:font-medium data-[state=checked]:text-[var(--accent)]",
                ].join(" ")}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  ),
);

Select.displayName = "Select";

/* ─── Chevron icon ── */

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="shrink-0 opacity-60"
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}
