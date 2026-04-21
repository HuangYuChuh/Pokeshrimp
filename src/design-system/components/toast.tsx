"use client";

import { Icon } from "@iconify/react";
import { useState, useCallback, useSyncExternalStore, type ReactNode } from "react";

/* ─── Types ── */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  isMounted: boolean;
  isRemoving: boolean;
}

/* ─── Variant config (Solar icons + design tokens) ── */

const V: Record<ToastVariant, [icon: string, color: string]> = {
  success: ["solar:check-circle-outline", "var(--success)"],
  error: ["solar:close-circle-outline", "var(--error)"],
  warning: ["solar:danger-triangle-outline", "var(--warning)"],
  info: ["solar:info-circle-outline", "var(--accent)"],
};

/* ─── Constants ── */

const DEFAULT_DURATION = 4000;
const TRANSITION_MS = 200;
const VISIBLE_COUNT = 3;
const GAP = 12;
const SCALE_STEP = 0.05;
const TOAST_HEIGHT = 56;

/* ─── Module-scoped store ──
 * No Zustand needed. Uses useSyncExternalStore for React binding.
 * Timer registry lives outside React state to avoid re-renders.
 * ────────────────────────────────────────────────────────── */

let toasts: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const autoDismissTimers = new Map<number, ReturnType<typeof setTimeout>>();
const removalTimers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  for (const fn of listeners) fn();
}

function getSnapshot() {
  return toasts;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function showToast(title: string, options?: ToastOptions): number {
  const id = ++nextId;
  const item: ToastItem = {
    id,
    title,
    description: options?.description,
    variant: options?.variant ?? "success",
    duration: options?.duration ?? DEFAULT_DURATION,
    isMounted: false,
    isRemoving: false,
  };
  toasts = [item, ...toasts];
  emit();

  // Double RAF: commit hidden state first, then flip to mounted for transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toasts = toasts.map((t) => (t.id === id ? { ...t, isMounted: true } : t));
      emit();
    });
  });

  const timer = setTimeout(() => dismissToast(id), item.duration);
  autoDismissTimers.set(id, timer);
  return id;
}

function dismissToast(id: number) {
  const target = toasts.find((t) => t.id === id);
  if (!target || target.isRemoving) return;

  const existing = autoDismissTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    autoDismissTimers.delete(id);
  }

  toasts = toasts.map((t) => (t.id === id ? { ...t, isRemoving: true } : t));
  emit();

  const removal = setTimeout(() => {
    removalTimers.delete(id);
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, TRANSITION_MS);
  removalTimers.set(id, removal);
}

function pauseTimers() {
  for (const [id, timer] of autoDismissTimers) {
    clearTimeout(timer);
    autoDismissTimers.delete(id);
  }
}

function resumeTimers() {
  for (const t of toasts) {
    if (t.isRemoving || autoDismissTimers.has(t.id)) continue;
    const timer = setTimeout(() => dismissToast(t.id), t.duration);
    autoDismissTimers.set(t.id, timer);
  }
}

/* ─── Hook ── */

export function useToast() {
  return { toast: showToast };
}

/* ─── Toaster (visual component) ── */

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEnter = useCallback(() => {
    setIsExpanded(true);
    pauseTimers();
  }, []);

  const handleLeave = useCallback(() => {
    setIsExpanded(false);
    resumeTimers();
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-[var(--space-6)] right-[var(--space-6)] z-[var(--z-toast)] w-[356px] max-w-[calc(100vw-var(--space-8))]"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ pointerEvents: "auto" }}
    >
      {items.slice(0, VISIBLE_COUNT).map((t, i) => {
        const [icon, color] = V[t.variant];
        const isHidden = !t.isMounted || t.isRemoving;
        const stackY = isExpanded ? -(i * (TOAST_HEIGHT + GAP)) : -(i * GAP);

        return (
          <div
            key={t.id}
            role="alert"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${isHidden ? 80 : stackY}px) scale(${isExpanded ? 1 : 1 - i * SCALE_STEP})`,
              opacity: isHidden ? 0 : 1,
              transition: `transform ${TRANSITION_MS}ms var(--ease-out, cubic-bezier(0.16,1,0.3,1)), opacity ${TRANSITION_MS}ms var(--ease-out, cubic-bezier(0.16,1,0.3,1))`,
              transformOrigin: "bottom center",
              zIndex: VISIBLE_COUNT - i,
              willChange: "transform, opacity",
              pointerEvents: t.isRemoving ? "none" : "auto",
            }}
          >
            <div className="flex items-start gap-[var(--space-3)] bg-[var(--surface)] rounded-[var(--radius-lg)] px-[var(--space-4)] py-[var(--space-3)] shadow-[var(--shadow-md)] border border-[var(--border-subtle)]">
              <Icon icon={icon} width={20} className="shrink-0 mt-[2px]" style={{ color }} />
              <div
                className="min-w-0"
                style={{
                  opacity: isExpanded || i === 0 ? 1 : 0,
                  transition: `opacity ${TRANSITION_MS}ms var(--ease-out, cubic-bezier(0.16,1,0.3,1))`,
                }}
              >
                <p className="text-[length:var(--text-body)] font-medium text-[var(--ink)] leading-[var(--leading-tight)]">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-[var(--space-1)] text-[length:var(--text-body-sm)] text-[var(--ink-secondary)] leading-[var(--leading-normal)]">
                    {t.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Provider (wraps Toaster) ── */

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
