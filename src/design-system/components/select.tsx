"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef, useState } from "react";

/* ─── Select ── */

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
  ({ options, value, onChange, placeholder = "Select...", className, disabled }, ref) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger
          ref={ref}
          disabled={disabled}
          className={[
            "inline-flex items-center justify-between gap-2",
            "w-full h-9 px-3 rounded-[var(--radius-md)]",
            "border border-[var(--border)] bg-[var(--surface)]",
            "text-[var(--text-body-sm)]",
            selected ? "text-[var(--ink)]" : "text-[var(--ink-ghost)]",
            "hover:border-[var(--border-strong)] transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
            "disabled:opacity-50 disabled:pointer-events-none",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronIcon open={open} />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className={[
              "z-[var(--z-dropdown)] w-[var(--radix-dropdown-menu-trigger-width)]",
              "max-h-[240px] overflow-y-auto",
              "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]",
              "p-1 shadow-[var(--shadow-sm)]",
            ].join(" ")}
          >
            {options.map((opt) => (
              <DropdownMenu.Item
                key={opt.value}
                onSelect={() => onChange?.(opt.value)}
                className={[
                  "flex items-center px-2 py-1.5",
                  "rounded-[var(--radius-sm)] text-[var(--text-body-sm)]",
                  "cursor-pointer select-none outline-none",
                  "data-[highlighted]:bg-[var(--accent-subtle)] data-[highlighted]:text-[var(--accent)]",
                  opt.value === value ? "text-[var(--accent)] font-medium" : "text-[var(--ink)]",
                ].join(" ")}
              >
                {opt.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);

Select.displayName = "Select";

/* ─── Chevron icon (inline) ── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}
