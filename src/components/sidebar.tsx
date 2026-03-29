"use client";

import { MODEL_OPTIONS } from "./model-options";

interface SidebarProps {
  modelId: string;
  onModelChange: (id: string) => void;
}

export function Sidebar({ modelId, onModelChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-[var(--border-color)] px-4">
        <h1 className="text-base font-semibold tracking-tight">Pokeshrimp</h1>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-3">
        <button className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]">
          + New Task
        </button>
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
      </div>
    </aside>
  );
}
