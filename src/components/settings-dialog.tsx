"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, ModalContent, Button, Separator, Skeleton } from "@/design-system/components";
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
  { id: "tools", label: "Tools & Integrations", icon: "solar:wrench-outline" },
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
      <ModalContent title="Settings" className="nodrag w-[720px] max-w-[90vw] max-h-[80vh] p-0">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <nav className="w-[180px] shrink-0 border-r border-[var(--border)] py-3">
            <div className="flex flex-col gap-0.5 px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(item.id)}
                    className="w-full justify-start gap-[var(--gap-inline)]"
                  >
                    <Icon icon={item.icon} width={15} />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!settings ? (
              <div className="space-y-5">
                <Skeleton className="h-[60px] w-full" />
                <Skeleton className="h-[60px] w-full" />
                <Skeleton className="h-[80px] w-full" />
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
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-[var(--text-micro)] text-[var(--ink-ghost)]">
            Saved to ~/.visagent/config.json
          </p>
          <div className="flex gap-[var(--gap-inline)]">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saved ? "Saved!" : saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
