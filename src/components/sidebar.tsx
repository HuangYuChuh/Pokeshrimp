"use client";

import { useEffect, useCallback } from "react";
import { MODEL_OPTIONS } from "./model-options";
import { useAppState, useAppDispatch } from "@/lib/store";

interface SidebarProps {
  modelId: string;
  onModelChange: (id: string) => void;
  onOpenSettings?: () => void;
}

export function Sidebar({ modelId, onModelChange, onOpenSettings }: SidebarProps) {
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
    <div
      className="drag"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        height: "100vh",
        background: "var(--bg-sidebar)",
        paddingTop: "var(--navbar-height)",
      }}
    >
      {/* New task button */}
      <div style={{ padding: "8px 12px" }}>
        <button
          onClick={handleNewTask}
          className="nodrag"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 12px",
            border: "none",
            borderRadius: 8,
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 13,
            cursor: "pointer",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          New Task
        </button>
      </div>

      {/* Session list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 12px",
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ padding: "16px 12px", fontSize: 12, color: "var(--text-tertiary)" }}>
            No sessions yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className="nodrag"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "7px 12px",
                  border: "none",
                  borderRadius: 6,
                  background: session.id === currentSessionId ? "var(--bg-active)" : "transparent",
                  color: session.id === currentSessionId ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background 150ms, color 150ms",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (session.id !== currentSessionId) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== currentSessionId) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                {session.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 16px",
          borderTop: "0.5px solid var(--border-subtle)",
        }}
      >
        <select
          value={modelId}
          onChange={(e) => onModelChange(e.target.value)}
          className="nodrag"
          style={{
            width: "100%",
            padding: "5px 8px",
            border: "0.5px solid var(--border-subtle)",
            borderRadius: 6,
            background: "var(--bg-input)",
            color: "var(--text-secondary)",
            fontSize: 12,
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
          }}
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="nodrag"
            title="Settings"
            style={{
              marginTop: 8,
              padding: 6,
              border: "none",
              borderRadius: 6,
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
