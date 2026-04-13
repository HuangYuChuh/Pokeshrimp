"use client";

import { useEffect, useCallback } from "react";
import { Plus, Puzzle, Settings, X } from "lucide-react";
import { useAppState, useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button, Separator } from "@heroui/react";

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

interface SidebarProps {
  open: boolean;
  onToggle?: () => void;
  onOpenSettings?: () => void;
  onOpenSkills?: () => void;
}

/* ---------------------------------------------------------------------------
 * Sidebar
 * --------------------------------------------------------------------------- */

export function Sidebar({ open, onOpenSettings, onOpenSkills }: SidebarProps) {
  const { sessions, currentSessionId } = useAppState();
  const dispatch = useAppDispatch();

  /* --- Fetch sessions on mount ------------------------------------------ */
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

  /* --- Session actions -------------------------------------------------- */
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
    (id: string) => {
      fetch(`/api/sessions/${id}`, { method: "DELETE" }).catch(() => {});
      dispatch({ type: "REMOVE_SESSION", id });
    },
    [dispatch],
  );

  /* --- Render ----------------------------------------------------------- */
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden bg-sidebar transition-all duration-200",
        open ? "w-[260px]" : "w-0",
      )}
    >
      {/* macOS traffic light spacer — no interactive elements here to avoid
          overlap with the native close/minimize/maximize buttons at { x: 12, y: 16 }.
          Sidebar toggle lives in the ChatPanel header (PanelLeft button). */}
      <div className="drag h-13 shrink-0" />

      {/* New task button */}
      <div className="px-3 pb-4">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          className="nodrag justify-start"
          onPress={handleNewTask}
        >
          <Plus size={15} strokeWidth={1.5} />
          <span className="truncate">New task</span>
        </Button>
      </div>

      {/* Recents label */}
      <div className="px-5 pb-2">
        <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-muted-foreground/60">
          Recents
        </span>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-px px-3">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            return (
              <div key={session.id} className="nodrag group relative">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  fullWidth
                  className="justify-start"
                  onPress={() => handleSelectSession(session.id)}
                >
                  <span className="truncate">{session.title}</span>
                </Button>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 hidden -translate-y-1/2 group-hover:flex"
                  onPress={() => handleDeleteSession(session.id)}
                >
                  <X size={12} strokeWidth={1.5} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom actions with separator */}
      {(onOpenSettings || onOpenSkills) && (
        <div className="shrink-0 px-3 py-3">
          <Separator className="mb-3" />
          {onOpenSkills && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="nodrag justify-start"
              onPress={onOpenSkills}
            >
              <Puzzle size={15} strokeWidth={1.5} />
              <span className="truncate">Skills</span>
            </Button>
          )}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="nodrag justify-start"
              onPress={onOpenSettings}
            >
              <Settings size={15} strokeWidth={1.5} />
              <span className="truncate">Settings</span>
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
