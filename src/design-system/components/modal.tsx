"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { forwardRef, type ReactNode } from "react";

/* ─── Modal (Root + Trigger re-export) ── */

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

/* ─── ModalContent ── */

interface ModalContentProps {
  children: ReactNode;
  className?: string;
  title: string;
  description?: string;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, title, description }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--overlay)] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <Dialog.Content
        ref={ref}
        className={[
          "fixed left-1/2 top-1/2 z-[var(--z-modal)] -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-[480px] max-h-[85vh] overflow-y-auto",
          "rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)]",
          "p-[var(--space-6)] shadow-[var(--shadow-md)]",
          "focus-visible:outline-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Dialog.Title className="text-[var(--text-headline)] font-semibold text-[var(--ink)] mb-1">
          {title}
        </Dialog.Title>
        {description && (
          <Dialog.Description className="text-[var(--text-body-sm)] text-[var(--ink-secondary)] mb-[var(--space-5)]">
            {description}
          </Dialog.Description>
        )}
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  ),
);

ModalContent.displayName = "ModalContent";
