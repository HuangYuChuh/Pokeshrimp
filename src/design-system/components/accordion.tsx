"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

/* ─── Accordion ──
 * Built on @radix-ui/react-accordion for correct ARIA:
 * aria-expanded, aria-controls, panel id — all handled by Radix.
 * ────────────────────────────────────────────────────────── */

export const Accordion = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={`divide-y divide-[var(--border)] ${className ?? ""}`}
    {...props}
  />
));

Accordion.displayName = "Accordion";

/* ─── AccordionItem ── */

export const AccordionItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={className} {...props} />
));

AccordionItem.displayName = "AccordionItem";

/* ─── AccordionTrigger ── */

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={[
        "flex flex-1 items-center justify-between py-3",
        "text-[var(--text-body-sm)] font-medium text-[var(--ink)]",
        "hover:text-[var(--accent)] transition-colors",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
      >
        <path d="M3 4.5L6 7.5L9 4.5" />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));

AccordionTrigger.displayName = "AccordionTrigger";

/* ─── AccordionContent ── */

export const AccordionContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={[
      "overflow-hidden text-[var(--text-body-sm)] text-[var(--ink-secondary)]",
      "data-[state=open]:pb-3",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));

AccordionContent.displayName = "AccordionContent";
