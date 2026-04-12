"use client";

import { useEffect, useCallback } from "react";
import { Plus, Settings, X } from "lucide-react";
import { useAppState, useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  onOpenSettings?: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
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
    const session = {
      id,
      title: "New Task",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_SESSION", session });
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    }).catch(() => {});
  }, [dispatch]);

  const handleSelectSession = useCallback(
    (id: string) => {
      dispatch({ type: "SET_CURRENT_SESSION", id });
    },
    [dispatch],
  );

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      fetch(`/api/sessions/${id}`, { method: "DELETE" }).catch(() => {});
      dispatch({ type: "REMOVE_SESSION", id });
    },
    [dispatch],
  );

  return (
    <aside className="drag flex h-full w-[260px] shrink-0 flex-col bg-sidebar">
      {/* macOS traffic light space */}
      <div className="h-13 shrink-0" />

      {/* New task */}
      <div className="px-3 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="nodrag h-8 w-full justify-start gap-2 text-[13px] text-muted-foreground hover:text-foreground"
          onClick={handleNewTask}
        >
          <Plus size={15} strokeWidth={1.5} />
          New task
        </Button>
      </div>

      {/* Recents label */}
      <div className="px-5 pb-2">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground/60">
          Recents
        </span>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-px px-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "nodrag group relative flex items-center rounded-lg transition-colors",
                session.id === currentSessionId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <button
                onClick={() => handleSelectSession(session.id)}
                className="w-full truncate px-3 py-1.5 text-left text-[13px]"
              >
                {session.title}
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="absolute right-1.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-foreground group-hover:flex"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Settings */}
      {onOpenSettings && (
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="nodrag h-8 w-full justify-start gap-2 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={onOpenSettings}
          >
            <Settings size={15} strokeWidth={1.5} />
            Settings
          </Button>
        </div>
      )}
    </aside>
  );
}
