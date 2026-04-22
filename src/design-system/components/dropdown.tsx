"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef, type ReactNode } from "react";

/* ─── Root / Trigger re-export ── */

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;

/* ─── DropdownContent ── */

interface DropdownContentProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ children, className, align = "start", sideOffset = 4 }, ref) => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={[
          "z-50 min-w-[160px] overflow-hidden",
          "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]",
          "p-1 shadow-[var(--shadow-sm)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  ),
);

DropdownContent.displayName = "DropdownContent";

/* ─── DropdownItem ── */

interface DropdownItemProps extends DropdownMenu.DropdownMenuItemProps {
  className?: string;
}

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Item
      ref={ref}
      className={[
        "flex items-center gap-[var(--gap-inline)] px-2 py-1.5",
        "rounded-[var(--radius-sm)] text-[var(--text-body-sm)] text-[var(--ink)]",
        "cursor-pointer select-none outline-none",
        "data-[highlighted]:bg-[var(--accent-subtle)] data-[highlighted]:text-[var(--accent)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
);

DropdownItem.displayName = "DropdownItem";

/* ─── DropdownSeparator ── */

export const DropdownSeparator = () => (
  <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
);
