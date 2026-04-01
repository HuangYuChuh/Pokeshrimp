"use client";

import { useState, useEffect, useCallback } from "react";
import { MODEL_OPTIONS } from "./model-options";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SettingsData {
  defaultModel: string;
  apiKeys: { anthropic: string; openai: string };
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("claude-sonnet");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
            anthropic: anthropicKey.includes("****") ? undefined : anthropicKey,
            openai: openaiKey.includes("****") ? undefined : openaiKey,
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
      className="nodrag fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-[480px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-[15px] font-semibold">Settings</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">API keys and model preferences</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>

        <Separator />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!settings ? (
            <p className="text-[13px] text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-5">
              <Field label="Default Model">
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Anthropic API Key" hint="Required for Claude models">
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  onFocus={(e) => {
                    if (e.target.value.includes("****")) setAnthropicKey("");
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </Field>

              <Field label="OpenAI API Key" hint="Required for GPT models">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  onFocus={(e) => {
                    if (e.target.value.includes("****")) setOpenaiKey("");
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </Field>

              <p className="text-[11px] text-muted-foreground/60">
                Saved to ~/.visagent/config.json
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? "Saved!" : saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium">{label}</label>
      {hint && <p className="mb-2 text-[12px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
