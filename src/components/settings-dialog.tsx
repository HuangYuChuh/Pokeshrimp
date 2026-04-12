"use client";

import { useState, useEffect, useCallback } from "react";
import { MODEL_OPTIONS } from "@/core/ai/provider";
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
  envKeys?: { anthropic: boolean; openai: boolean };
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("claude-sonnet");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"dark" | "light" | "system">("dark");

  const isElectron = typeof window !== "undefined" && !!window.pokeshrimp?.auth;

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("pokeshrimp-theme") as "dark" | "light" | "system" | null;
    if (stored) setThemeState(stored);
  }, []);

  const handleThemeChange = useCallback((value: "dark" | "light" | "system") => {
    setThemeState(value);
    localStorage.setItem("pokeshrimp-theme", value);
    const root = document.documentElement;
    if (value === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", value === "dark");
    }
  }, []);

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

  const handleOpenAIOAuth = useCallback(async () => {
    if (!window.pokeshrimp?.auth) return;
    setOauthLoading(true);
    setOauthError(null);
    try {
      const { accessToken } = await window.pokeshrimp.auth.openaiOAuth!();
      setOpenaiKey(accessToken);
      // Auto-save the token
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel,
          apiKeys: {
            anthropic: anthropicKey.includes("****") ? undefined : anthropicKey,
            openai: accessToken,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OAuth failed";
      if (!message.includes("User closed")) {
        setOauthError(message);
      }
    } finally {
      setOauthLoading(false);
    }
  }, [defaultModel, anthropicKey]);

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

              <Field label="Theme">
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value as "dark" | "light" | "system")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </Field>

              <Field label="Anthropic API Key" hint="Required for Claude models" getKeyUrl="https://console.anthropic.com/settings/keys">
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
                <EnvKeyHint envAvailable={settings.envKeys?.anthropic} hasConfigKey={!!settings.apiKeys?.anthropic} envVarName="ANTHROPIC_API_KEY" />
              </Field>

              <Field label="OpenAI API Key" hint="Required for GPT models" getKeyUrl="https://platform.openai.com/api-keys">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    onFocus={(e) => {
                      if (e.target.value.includes("****")) setOpenaiKey("");
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                  {isElectron && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-[12px]"
                      disabled={oauthLoading}
                      onClick={handleOpenAIOAuth}
                    >
                      {oauthLoading ? "Logging in..." : "Login with OpenAI"}
                    </Button>
                  )}
                </div>
                {oauthError && (
                  <p className="mt-1 text-[11px] text-red-500">{oauthError}</p>
                )}
                <EnvKeyHint envAvailable={settings.envKeys?.openai} hasConfigKey={!!settings.apiKeys?.openai} envVarName="OPENAI_API_KEY" />
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

function openKeyUrl(url: string) {
  if (window.pokeshrimp?.auth?.openBrowser) {
    window.pokeshrimp.auth.openBrowser(url);
  } else {
    window.open(url, "_blank");
  }
}

function Field({ label, hint, getKeyUrl, children }: { label: string; hint?: string; getKeyUrl?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[13px] font-medium">{label}</label>
        {getKeyUrl && (
          <button
            type="button"
            onClick={() => openKeyUrl(getKeyUrl)}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Get key &rarr;
          </button>
        )}
      </div>
      {hint && <p className="mb-2 text-[12px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function EnvKeyHint({ envAvailable, hasConfigKey, envVarName }: { envAvailable?: boolean; hasConfigKey: boolean; envVarName: string }) {
  if (!envAvailable) return null;
  if (hasConfigKey) {
    return <p className="mt-1.5 text-[11px] text-muted-foreground">Config key takes priority over env var</p>;
  }
  return <p className="mt-1.5 text-[11px] text-emerald-500">Using {envVarName} from environment</p>;
}
