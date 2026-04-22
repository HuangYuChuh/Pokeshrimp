"use client";

import { useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useAppState, useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button, Separator } from "@/design-system/components";

interface SidebarProps {
  open: boolean;
  onOpenSettings?: () => void;
  onOpenSkills?: () => void;
}

export function Sidebar({ open, onOpenSettings, onOpenSkills }: SidebarProps) {
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
    const session = { id, title: "New Task", createdAt: new Date().toISOString() };
    dispatch({ type: "ADD_SESSION", session });
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    }).catch(() => {});
  }, [dispatch]);

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
        "flex h-full shrink-0 flex-col overflow-hidden bg-[var(--canvas-subtle)] transition-all duration-200",
        open ? "w-[var(--width-sidebar)]" : "w-0",
      )}
    >
      <div className="drag h-13 shrink-0" />

      <div className="px-3 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="nodrag w-full justify-start"
          onClick={handleNewTask}
        >
          <Icon icon="solar:add-circle-outline" width={15} />
          <span className="truncate">New task</span>
        </Button>
      </div>

      <div className="px-5 pb-2">
        <span className="whitespace-nowrap text-[var(--text-micro)] font-medium tracking-wide text-[var(--ink-ghost)]">
          Recents
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-px px-3">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            return (
              <div key={session.id} className="nodrag group relative">
                <Button
                  variant={isActive ? "outline" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <span className="truncate">{session.title}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 hidden h-6 w-6 min-w-0 -translate-y-1/2 p-0 group-hover:flex"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <Icon icon="solar:close-circle-outline" width={12} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {(onOpenSettings || onOpenSkills) && (
        <div className="shrink-0 px-3 py-3">
          <Separator className="mb-3" />
          {onOpenSkills && (
            <Button
              variant="ghost"
              size="sm"
              className="nodrag w-full justify-start"
              onClick={onOpenSkills}
            >
              <Icon icon="solar:widget-outline" width={15} />
              <span className="truncate">Skills</span>
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
              <span className="truncate">Settings</span>
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
