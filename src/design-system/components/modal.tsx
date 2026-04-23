"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { forwardRef, type ReactNode } from "react";
import { Icon } from "@iconify/react";

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
  hideHeader?: boolean;
  /** Use "lg" for wide dialogs like Settings (no default max-w constraint) */
  size?: "default" | "lg";
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, title, description, hideHeader, size = "default" }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-30 bg-[var(--overlay)]" />
      <Dialog.Content
        ref={ref}
        className={[
          "fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2",
          size === "default" &&
            "w-full max-w-[480px] max-h-[85vh] overflow-y-auto p-[var(--space-6)]",
          size === "lg" && "max-h-[88vh]",
          "rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)]",
          "shadow-[var(--shadow-md)]",
          "focus-visible:outline-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {size === "default" && (
          <Dialog.Close className="absolute right-4 top-4 rounded-[var(--radius-sm)] p-1 text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <Icon icon="solar:close-circle-outline" width={18} />
          </Dialog.Close>
        )}

        {!hideHeader && (
          <>
            <Dialog.Title className="text-[var(--text-headline)] font-semibold text-[var(--ink)] mb-[var(--space-1)] pr-8">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-[var(--text-body-sm)] text-[var(--ink-secondary)] mb-[var(--space-5)]">
                {description}
              </Dialog.Description>
            )}
          </>
        )}
        {hideHeader && <Dialog.Title className="sr-only">{title}</Dialog.Title>}
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  ),
);

ModalContent.displayName = "ModalContent";
