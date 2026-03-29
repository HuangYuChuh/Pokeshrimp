"use client";

export function Sidebar() {
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

      {/* Footer */}
      <div className="border-t border-[var(--border-color)] p-3">
        <div className="text-xs text-[var(--text-secondary)]">
          Pokeshrimp v0.1.0
        </div>
      </div>
    </aside>
  );
}
