"use client";

import { useCallback } from "react";
import { useAppState, useAppDispatch, type PreviewTab } from "@/lib/store";

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "editor", label: "Editor" },
  { id: "output", label: "Output" },
];

export function PreviewPanel() {
  const { previewTab, previewContent, editorParams, outputFiles } =
    useAppState();
  const dispatch = useAppDispatch();

  const handleTabChange = useCallback(
    (tab: PreviewTab) => {
      dispatch({ type: "SET_PREVIEW_TAB", tab });
    },
    [dispatch],
  );

  const handleEditorChange = useCallback(
    (value: string) => {
      dispatch({ type: "SET_EDITOR_PARAMS", params: value });
    },
    [dispatch],
  );

  return (
    <aside className="flex h-full w-[var(--preview-width)] shrink-0 flex-col border-l border-[var(--border-color)] bg-[var(--bg-secondary)]">
      {/* Tab bar */}
      <div className="flex h-14 items-center gap-1 border-b border-[var(--border-color)] px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              previewTab === tab.id
                ? "bg-[var(--bg-tertiary)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {previewTab === "preview" && <PreviewTabContent content={previewContent} />}
        {previewTab === "editor" && (
          <EditorTabContent value={editorParams} onChange={handleEditorChange} />
        )}
        {previewTab === "output" && <OutputTabContent files={outputFiles} />}
      </div>
    </aside>
  );
}

// --- Preview Tab ---

function PreviewTabContent({
  content,
}: {
  content: { type: string; url?: string; text?: string };
}) {
  if (content.type === "image" && content.url) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <img
          src={content.url}
          alt="Generated preview"
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
    );
  }

  if (content.type === "text" && content.text) {
    return (
      <div className="flex-1 p-6">
        <pre className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
          {content.text}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-sm text-[var(--text-secondary)]">
        Generated content will appear here
      </p>
    </div>
  );
}

// --- Editor Tab ---

function EditorTabContent({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <label className="mb-2 text-xs text-[var(--text-secondary)]">
        Generation Parameters (JSON)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        placeholder='{"prompt": "...", "width": 1024, "height": 1024}'
      />
    </div>
  );
}

// --- Output Tab ---

function OutputTabContent({ files }: { files: { name: string; path: string; type: string }[] }) {
  if (files.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Output files will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <div className="space-y-1">
        {files.map((file, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5"
          >
            <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
              {file.type}
            </span>
            <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
              {file.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
