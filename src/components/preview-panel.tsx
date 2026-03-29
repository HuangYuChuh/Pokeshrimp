"use client";

export function PreviewPanel() {
  return (
    <aside className="flex h-full w-[var(--preview-width)] shrink-0 flex-col border-l border-[var(--border-color)] bg-[var(--bg-secondary)]">
      {/* Tab bar */}
      <div className="flex h-14 items-center gap-1 border-b border-[var(--border-color)] px-4">
        <button className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--text-primary)]">
          Preview
        </button>
        <button className="rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          Editor
        </button>
        <button className="rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          Output
        </button>
      </div>

      {/* Preview content */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Generated content will appear here
        </p>
      </div>
    </aside>
  );
}
