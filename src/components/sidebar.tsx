"use client";

import { useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useAppState, useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
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
            <button
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={cn(
                "nodrag w-full truncate rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors",
                session.id === currentSessionId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {session.title}
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
