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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "var(--preview-width)",
        minWidth: "var(--preview-width)",
        height: "100vh",
        borderLeft: "0.5px solid var(--border-subtle)",
        background: "var(--bg-sidebar)",
      }}
    >
      {/* Navbar spacer */}
      <div className="drag" style={{ height: "var(--navbar-height)", flexShrink: 0 }} />

      {/* Tab bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "0 16px",
        height: 36,
        flexShrink: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="nodrag"
            style={{
              padding: "4px 10px",
              border: "none",
              borderRadius: 6,
              background: previewTab === tab.id ? "var(--bg-active)" : "transparent",
              color: previewTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 150ms, color 150ms",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ margin: "0 16px", borderBottom: "0.5px solid var(--border-subtle)" }} />

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {previewTab === "preview" && <PreviewContent content={previewContent} />}
        {previewTab === "editor" && <EditorContent value={editorParams} onChange={handleEditorChange} />}
        {previewTab === "output" && <OutputContent files={outputFiles} />}
      </div>
    </div>
  );
}

function PreviewContent({ content }: { content: { type: string; url?: string; text?: string } }) {
  if (content.type === "image" && content.url) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 24 }}>
        <img src={content.url} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, objectFit: "contain" }} />
      </div>
    );
  }
  if (content.type === "text" && content.text) {
    return (
      <div className="selectable" style={{ padding: 20, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
        {content.text}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "var(--text-tertiary)" }}>
      Generated content will appear here
    </div>
  );
}

function EditorContent({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 16 }}>
      <label style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)" }}>
        Parameters
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="selectable"
        style={{
          flex: 1,
          resize: "none",
          padding: 12,
          border: "0.5px solid var(--border-subtle)",
          borderRadius: 8,
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.5,
          outline: "none",
        }}
        placeholder='{ "prompt": "..." }'
      />
    </div>
  );
}

function OutputContent({ files }: { files: { name: string; path: string; type: string }[] }) {
  if (files.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "var(--text-tertiary)" }}>
        Output files will appear here
      </div>
    );
  }
  return (
    <div style={{ padding: 16 }}>
      {files.map((file, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 6,
          cursor: "pointer",
          transition: "background 150ms",
          marginBottom: 2,
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>
            {file.type}
          </span>
          <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
        </div>
      ))}
    </div>
  );
}
