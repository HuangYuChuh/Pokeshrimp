"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAppState, useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/* ─── Types ── */

interface SidebarProps {
  open: boolean;
  onOpenSettings?: () => void;
  onOpenSkills?: () => void;
}

/* ─── Relative time formatter ── */

function formatRelativeTime(iso: string, t: ReturnType<typeof useT>): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const months = Math.floor(diffMs / 2_592_000_000);

  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo.replace("{n}", String(mins));
  if (hrs < 24) return t.hoursAgo.replace("{n}", String(hrs));
  if (days < 30) return t.daysAgo.replace("{n}", String(days));
  return t.monthsAgo.replace("{n}", String(months));
}

/* ─── Sidebar ── */

export function Sidebar({ open, onOpenSettings, onOpenSkills }: SidebarProps) {
  const t = useT();
  const { sessions, currentSessionId } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => (res.ok ? res.json() : { sessions: [] }))
      .then((data) => {
        if (data.sessions) {
          dispatch({ type: "SET_SESSIONS", sessions: data.sessions });
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const handleNewTask = useCallback(() => {
    const id = crypto.randomUUID();
    const session = { id, title: t.newTask, createdAt: new Date().toISOString() };
    dispatch({ type: "ADD_SESSION", session });
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    }).catch(() => {});
  }, [dispatch, t.newTask]);

  const handleSelectSession = useCallback(
    (id: string) => dispatch({ type: "SET_CURRENT_SESSION", id }),
    [dispatch],
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      fetch(`/api/sessions/${id}`, { method: "DELETE" }).catch(() => {});
      dispatch({ type: "REMOVE_SESSION", id });
    },
    [dispatch],
  );

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden bg-[var(--canvas-subtle)]",
        "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        open ? "w-[var(--width-sidebar)]" : "w-0",
      )}
    >
      {/* ── Titlebar drag region ── */}
      <div className="drag h-[var(--height-titlebar)] shrink-0" />

      {/* ── Brand + New Task ── */}
      <div className="flex flex-col gap-[var(--space-3)] px-[var(--space-3)] pb-[var(--space-4)]">
        {/* Brand glyph */}
        <div className="nodrag flex items-center gap-[var(--space-2)] px-[var(--space-1)]">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
              "border border-[var(--accent)] bg-[var(--accent-subtle)]",
            )}
          >
            <span className="text-[13px] font-bold leading-none text-[var(--accent)]">P</span>
          </div>
          <span className="text-[13px] font-semibold text-[var(--ink)]">
            pokeshrimp
            <span className="text-[var(--accent)]">.</span>
          </span>
        </div>

        {/* New task button */}
        <button
          type="button"
          onClick={handleNewTask}
          className={cn(
            "nodrag flex h-8 w-full items-center gap-[var(--gap-inline)]",
            "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]",
            "px-[var(--space-3)] text-[var(--text-body-sm)] font-medium text-[var(--ink)]",
            "transition-colors hover:bg-[var(--surface-raised)]",
          )}
        >
          <Icon icon="solar:add-circle-outline" width={15} />
          <span>{t.newTask}</span>
          <kbd
            className={cn("ml-auto font-[var(--font-mono)] text-[10px] text-[var(--ink-ghost)]")}
          >
            ⌘N
          </kbd>
        </button>
      </div>

      {/* ── Recents label ── */}
      <div className="px-[var(--space-4)] pb-[var(--space-2)]">
        <span
          className={cn(
            "whitespace-nowrap text-[var(--text-micro)] font-medium uppercase",
            "tracking-[0.03em] text-[var(--ink-ghost)]",
          )}
        >
          {t.recents}
        </span>
      </div>

      {/* ── Session list ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-px px-[var(--space-3)]">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === currentSessionId}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      {(onOpenSettings || onOpenSkills) && (
        <div
          className={cn(
            "shrink-0 border-t border-[var(--border-subtle)]",
            "flex gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-3)]",
          )}
        >
          {onOpenSkills && (
            <button
              type="button"
              onClick={onOpenSkills}
              className={cn(
                "nodrag flex flex-1 h-[30px] items-center justify-center gap-[var(--gap-inline)]",
                "rounded-[var(--radius-md)] border border-[var(--border)]",
                "text-[12px] font-medium text-[var(--ink-secondary)]",
                "transition-colors hover:bg-[var(--border-subtle)]",
              )}
            >
              <Icon icon="solar:widget-outline" width={14} />
              <span>{t.skills}</span>
            </button>
          )}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={cn(
                "nodrag flex flex-1 h-[30px] items-center justify-center gap-[var(--gap-inline)]",
                "rounded-[var(--radius-md)] border border-[var(--border)]",
                "text-[12px] font-medium text-[var(--ink-secondary)]",
                "transition-colors hover:bg-[var(--border-subtle)]",
              )}
            >
              <Icon icon="solar:settings-outline" width={14} />
              <span>{t.settings}</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

/* ─── Session item with confirm-to-delete ── */

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: { id: string; title: string; createdAt?: string };
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  const timeLabel = useMemo(
    () => (session.createdAt ? formatRelativeTime(session.createdAt, t) : ""),
    [session.createdAt, t],
  );

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="nodrag group relative flex items-center">
      <button
        type="button"
        onClick={() => onSelect(session.id)}
        className={cn(
          "flex w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)]",
          "px-[var(--space-3)] py-[var(--space-2)] pr-8",
          "text-left transition-colors",
          isActive
            ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
            : "text-[var(--ink)] hover:bg-[var(--border-subtle)]",
        )}
      >
        {/* Status dot — idle for all sessions */}
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ink-tertiary)]" />

        {/* Title */}
        <span
          className={cn(
            "flex-1 truncate text-[13px] font-medium",
            isActive ? "text-[var(--accent)]" : "",
          )}
        >
          {session.title}
        </span>

        {/* Timestamp */}
        {timeLabel && (
          <span
            className={cn(
              "shrink-0 font-[var(--font-mono)] text-[10px] text-[var(--ink-ghost)]",
              "ml-auto",
            )}
          >
            {timeLabel}
          </span>
        )}
      </button>

      {/* Delete button */}
      <button
        type="button"
        className={cn(
          "absolute right-1 flex h-5 w-5 shrink-0 items-center justify-center",
          "rounded-[var(--radius-sm)] transition-opacity",
          confirming
            ? "bg-[var(--error)] text-white opacity-100"
            : "text-[var(--ink-ghost)] opacity-0 hover:text-[var(--ink)] group-hover:opacity-100 focus-visible:opacity-100",
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (confirming) {
            onDelete(session.id);
          } else {
            setConfirming(true);
          }
        }}
        aria-label={confirming ? t.confirmDelete : t.deleteSession}
        title={confirming ? t.confirmDelete : t.delete}
      >
        <Icon
          icon={confirming ? "solar:trash-bin-2-outline" : "solar:close-circle-outline"}
          width={12}
        />
      </button>
    </div>
  );
}
