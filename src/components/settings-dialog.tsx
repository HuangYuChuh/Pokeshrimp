"use client";

import { useState, useEffect, useCallback } from "react";
import { MODEL_OPTIONS } from "./model-options";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SettingsData {
  defaultModel: string;
  apiKeys: {
    anthropic: string;
    openai: string;
  };
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("claude-sonnet");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings on open
  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        setSettings(data);
        setAnthropicKey(data.apiKeys?.anthropic ?? "");
        setOpenaiKey(data.apiKeys?.openai ?? "");
        setDefaultModel(data.defaultModel ?? "claude-sonnet");
      })
      .catch(() => {});
  }, [open]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel,
          apiKeys: {
            // Only send non-masked values (user typed a new key)
            anthropic: anthropicKey.includes("••") ? undefined : anthropicKey,
            openai: openaiKey.includes("••") ? undefined : openaiKey,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [defaultModel, anthropicKey, openaiKey]);

  if (!open) return null;

  return (
    <div
      className="nodrag"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 480,
          maxHeight: "80vh",
          borderRadius: 16,
          background: "var(--card, #1c1c21)",
          border: "1px solid var(--border, rgba(255,255,255,0.1))",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Settings</h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground, #888)", marginTop: 4 }}>
            Configure API keys and default model
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {!settings ? (
            <p style={{ fontSize: 13, color: "var(--muted-foreground, #888)" }}>Loading...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Default Model */}
              <Field label="Default Model">
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border, rgba(255,255,255,0.1))",
                    background: "var(--background, #09090b)",
                    color: "var(--foreground, #e4e4e7)",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Anthropic API Key */}
              <Field label="Anthropic API Key" hint="Used for Claude models">
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  onFocus={(e) => {
                    if (e.target.value.includes("••")) {
                      setAnthropicKey("");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border, rgba(255,255,255,0.1))",
                    background: "var(--background, #09090b)",
                    color: "var(--foreground, #e4e4e7)",
                    fontSize: 13,
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </Field>

              {/* OpenAI API Key */}
              <Field label="OpenAI API Key" hint="Used for GPT models">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  onFocus={(e) => {
                    if (e.target.value.includes("••")) {
                      setOpenaiKey("");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border, rgba(255,255,255,0.1))",
                    background: "var(--background, #09090b)",
                    color: "var(--foreground, #e4e4e7)",
                    fontSize: 13,
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </Field>

              {/* Config path info */}
              <p style={{ fontSize: 11, color: "var(--muted-foreground, #666)" }}>
                Config saved to ~/.visagent/config.json
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border, rgba(255,255,255,0.1))",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--border, rgba(255,255,255,0.1))",
              background: "transparent",
              color: "var(--foreground, #e4e4e7)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--primary, #e4e4e7)",
              color: "var(--primary-foreground, #1c1c21)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: 12, color: "var(--muted-foreground, #888)", marginBottom: 8 }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}
