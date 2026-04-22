"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, ModalContent, Button, Skeleton } from "@/design-system/components";
import { Icon } from "@iconify/react";
import {
  type McpServerConfig,
  type HookEntryConfig,
  type PermissionConfig,
} from "@/components/settings-sections";
import { AccountsTab } from "@/components/settings/accounts-tab";
import { ModelsTab } from "@/components/settings/models-tab";
import { SkillsTab } from "@/components/settings/skills-tab";
import { ToolsTab } from "@/components/settings/tools-tab";
import { AutomationTab } from "@/components/settings/automation-tab";
import { AppearanceTab } from "@/components/settings/appearance-tab";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
}

interface SettingsData {
  defaultModel: string;
  apiKeys: { anthropic: string; openai: string };
  envKeys?: { anthropic: boolean; openai: boolean };
  mcpServers?: Record<string, McpServerConfig>;
  hooks?: Record<string, HookEntryConfig[]>;
  permissions?: PermissionConfig;
  conventionHooks?: string[];
}

type SettingsTabId = "accounts" | "models" | "skills" | "tools" | "automation" | "appearance";

const NAV_ITEMS: { id: SettingsTabId; label: string; icon: string }[] = [
  { id: "accounts", label: "Accounts", icon: "solar:key-outline" },
  { id: "models", label: "Models", icon: "solar:cpu-bolt-outline" },
  { id: "skills", label: "Skills", icon: "solar:widget-outline" },
  { id: "tools", label: "Tools", icon: "solar:wrench-outline" },
  { id: "automation", label: "Automation", icon: "solar:bolt-outline" },
  { id: "appearance", label: "Appearance", icon: "solar:palette-outline" },
];

export type { SettingsTabId };

export function SettingsDialog({ open, onClose, initialTab }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab ?? "accounts");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("claude-sonnet");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [theme, setThemeState] = useState<"dark" | "light" | "system">("dark");
  const [mcpServers, setMcpServers] = useState<Record<string, McpServerConfig>>({});
  const [hooks, setHooks] = useState<Record<string, HookEntryConfig[]>>({});
  const [permissions, setPermissions] = useState<PermissionConfig>({
    alwaysAllow: [],
    alwaysDeny: [],
    alwaysAsk: [],
  });
  const [conventionHooks, setConventionHooks] = useState<string[]>([]);

  const isElectron = typeof window !== "undefined" && !!window.pokeshrimp?.auth;

  useEffect(() => {
    if (open && initialTab) setActiveTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    const stored = localStorage.getItem("pokeshrimp-theme") as "dark" | "light" | "system" | null;
    if (stored) setThemeState(stored);
  }, []);

  const handleThemeChange = useCallback((value: "dark" | "light" | "system") => {
    setThemeState(value);
    localStorage.setItem("pokeshrimp-theme", value);
    const root = document.documentElement;
    if (value === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else if (value === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    }
  }, []);

  useEffect(() => {
    if (!open || !isElectron) return;
    window.pokeshrimp?.auth
      ?.getValidToken?.()
      .then((token) => setOauthConnected(!!token))
      .catch(() => setOauthConnected(false));
  }, [open, isElectron]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        setSettings(data);
        setAnthropicKey(data.apiKeys?.anthropic ?? "");
        setOpenaiKey(data.apiKeys?.openai ?? "");
        setDefaultModel(data.defaultModel ?? "claude-sonnet");
        setMcpServers(data.mcpServers ?? {});
        setHooks(data.hooks ?? {});
        setPermissions(data.permissions ?? { alwaysAllow: [], alwaysDeny: [], alwaysAsk: [] });
        setConventionHooks(data.conventionHooks ?? []);
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
          mcpServers,
          hooks,
          permissions,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }, [defaultModel, anthropicKey, openaiKey, mcpServers, hooks, permissions]);

  const handleOauthAutoSave = useCallback(
    async (openaiToken: string) => {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel,
          apiKeys: {
            anthropic: anthropicKey.includes("****") ? undefined : anthropicKey,
            openai: openaiToken,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [defaultModel, anthropicKey],
  );

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ModalContent
        title="Settings"
        hideHeader
        className="nodrag w-[800px] max-w-[92vw] max-h-[88vh] min-h-[520px] p-0 flex flex-col overflow-hidden"
      >
        {/* ── Sidebar + Content ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <nav className="w-[200px] shrink-0 bg-[var(--canvas-subtle)] py-5 overflow-y-auto">
            <div className="px-[var(--space-4)] mb-5">
              <h2 className="text-[var(--text-title)] font-semibold text-[var(--ink)]">Settings</h2>
            </div>
            <div className="flex flex-col gap-px px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={[
                      "flex items-center gap-[var(--space-3)] w-full px-[var(--space-3)] py-2 rounded-[var(--radius-md)]",
                      "text-[var(--text-body-sm)] transition-colors text-left",
                      isActive
                        ? "bg-[var(--surface)] text-[var(--ink)] font-medium shadow-[var(--shadow-xs)]"
                        : "text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--border-subtle)]",
                    ].join(" ")}
                  >
                    <Icon
                      icon={item.icon}
                      width={16}
                      className={isActive ? "text-[var(--accent)]" : ""}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[520px] px-8 py-6">
              {!settings ? (
                <div className="space-y-6">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-5 w-40 mt-4" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : (
                <>
                  {activeTab === "accounts" && (
                    <AccountsTab
                      anthropicKey={anthropicKey}
                      openaiKey={openaiKey}
                      onAnthropicKeyChange={setAnthropicKey}
                      onOpenaiKeyChange={setOpenaiKey}
                      envKeys={settings.envKeys}
                      apiKeys={settings.apiKeys}
                      oauthConnected={oauthConnected}
                      onOauthConnected={setOauthConnected}
                      onAutoSave={handleOauthAutoSave}
                    />
                  )}
                  {activeTab === "models" && (
                    <ModelsTab defaultModel={defaultModel} onDefaultModelChange={setDefaultModel} />
                  )}
                  {activeTab === "skills" && <SkillsTab active={activeTab === "skills"} />}
                  {activeTab === "tools" && (
                    <ToolsTab
                      active={activeTab === "tools"}
                      mcpServers={mcpServers}
                      onMcpServersChange={setMcpServers}
                    />
                  )}
                  {activeTab === "automation" && (
                    <AutomationTab
                      hooks={hooks}
                      conventionHooks={conventionHooks}
                      onHooksChange={setHooks}
                      permissions={permissions}
                      onPermissionsChange={setPermissions}
                    />
                  )}
                  {activeTab === "appearance" && (
                    <AppearanceTab theme={theme} onThemeChange={handleThemeChange} />
                  )}
                </>
              )}
            </div>

            {/* Footer — inside scroll area so it doesn't eat space */}
            <div className="sticky bottom-0 flex items-center justify-between px-8 py-4 bg-[var(--surface)] border-t border-[var(--border)]">
              <p className="text-[var(--text-caption)] text-[var(--ink-ghost)]">
                ~/.visagent/config.json
              </p>
              <div className="flex gap-[var(--space-3)]">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                  {saved ? "Saved!" : saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
