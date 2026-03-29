"use client";

import { useEffect, useCallback } from "react";
import { MODEL_OPTIONS } from "./model-options";
import { useAppState, useAppDispatch } from "@/lib/store";

interface SidebarProps {
  modelId: string;
  onModelChange: (id: string) => void;
}

export function Sidebar({ modelId, onModelChange }: SidebarProps) {
  const { sessions, currentSessionId } = useAppState();
  const dispatch = useAppDispatch();

  // Fetch sessions on mount
  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => {
        if (res.ok) return res.json();
        return { sessions: [] };
      })
      .then((data) => {
        if (data.sessions) {
          dispatch({ type: "SET_SESSIONS", sessions: data.sessions });
        }
      })
      .catch(() => {
        // API not available yet — ignore
      });
  }, [dispatch]);

  const handleNewTask = useCallback(() => {
    const id = crypto.randomUUID();
    const session = {
      id,
      title: "New Task",
      createdAt: new Date().toISOString(),
    };

    // Optimistic add
    dispatch({ type: "ADD_SESSION", session });

    // Try to persist via API
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    }).catch(() => {
      // API not available yet — session stays local
    });
  }, [dispatch]);

  const handleSelectSession = useCallback(
    (id: string) => {
      dispatch({ type: "SET_CURRENT_SESSION", id });
    },
    [dispatch],
  );

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-[var(--border-color)] px-4">
        <h1 className="text-base font-semibold tracking-tight">Pokeshrimp</h1>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-3">
        <button
          onClick={handleNewTask}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        >
          + New Task
        </button>

        <div className="space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                session.id === currentSessionId
                  ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="truncate">{session.title}</div>
              <div className="mt-0.5 text-xs text-[var(--text-secondary)] opacity-60">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div className="border-t border-[var(--border-color)] p-3">
        <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">
          Model
        </label>
        <select
          value={modelId}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Version */}
        <div className="mt-2 text-center text-xs text-[var(--text-secondary)] opacity-50">
          v0.1.0
        </div>
      </div>
    </aside>
  );
}
