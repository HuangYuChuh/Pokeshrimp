"use client";

import { useEffect, useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import { useAppState, useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button, Separator } from "@/design-system/components";
import { useT } from "@/lib/i18n";

interface SidebarProps {
  open: boolean;
  onOpenSettings?: () => void;
  onOpenSkills?: () => void;
}

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
        "flex h-full shrink-0 flex-col overflow-hidden bg-[var(--canvas-subtle)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        open ? "w-[var(--width-sidebar)]" : "w-0",
      )}
    >
      <div className="drag h-[var(--height-titlebar)] shrink-0" />

      <div className="px-[var(--space-3)] pb-[var(--space-4)]">
        <Button
          variant="ghost"
          size="sm"
          className="nodrag w-full justify-start"
          onClick={handleNewTask}
        >
          <Icon icon="solar:add-circle-outline" width={15} />
          <span className="truncate">{t.newTask}</span>
        </Button>
      </div>

      <div className="px-[var(--space-5)] pb-[var(--space-2)]">
        <span className="whitespace-nowrap text-[var(--text-micro)] font-medium tracking-wide text-[var(--ink-ghost)]">
          {t.recents}
        </span>
      </div>

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

      {(onOpenSettings || onOpenSkills) && (
        <div className="shrink-0 px-[var(--space-3)] py-[var(--space-3)]">
          <Separator className="mb-[var(--space-3)]" />
          {onOpenSkills && (
            <Button
              variant="ghost"
              size="sm"
              className="nodrag w-full justify-start"
              onClick={onOpenSkills}
            >
              <Icon icon="solar:widget-outline" width={15} />
              <span className="truncate">{t.skills}</span>
            </Button>
          )}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              className="nodrag w-full justify-start"
              onClick={onOpenSettings}
            >
              <Icon icon="solar:settings-outline" width={15} />
              <span className="truncate">{t.settings}</span>
            </Button>
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
  session: { id: string; title: string };
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="nodrag group relative flex items-center">
      <Button
        variant={isActive ? "outline" : "ghost"}
        size="sm"
        className="w-full justify-start pr-8"
        onClick={() => onSelect(session.id)}
      >
        <span className="truncate">{session.title}</span>
      </Button>
      <Button
        variant={confirming ? "danger" : "ghost"}
        size="icon-sm"
        className={cn(
          "absolute right-1 shrink-0 transition-opacity",
          confirming
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
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
      </Button>
    </div>
  );
}
