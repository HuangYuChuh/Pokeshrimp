"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

/* ─── Types ── */

type ToastVariant = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

/* ─── Context ── */

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

/* ─── Styles ── */

const variantStyles: Record<ToastVariant, string> = {
  default: "border-[var(--border)] text-[var(--ink)]",
  success: "border-[var(--success)] text-[var(--success)]",
  error: "border-[var(--error)] text-[var(--error)]",
  warning: "border-[var(--warning)] text-[var(--warning)]",
};

/* ─── Provider ── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Toast Item ── */

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={[
        "px-4 py-3 rounded-[var(--radius-lg)] border bg-[var(--surface)]",
        "shadow-[var(--shadow-sm)] text-[var(--text-body-sm)]",
        "animate-in slide-in-from-right-5 fade-in-0",
        "min-w-[240px] max-w-[360px]",
        variantStyles[toast.variant],
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}
