"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal, ModalContent, Skeleton } from "@/design-system/components";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";
import {
  type HookEntryConfig,
  type McpServerConfig,
  type PermissionConfig,
} from "@/components/settings-sections";
import { AccountsTab } from "@/components/settings/accounts-tab";
import { AppearanceTab } from "@/components/settings/appearance-tab";
import { AutomationTab } from "@/components/settings/automation-tab";
import { ModelsTab } from "@/components/settings/models-tab";
import { SkillsTab } from "@/components/settings/skills-tab";
import { ToolsTab } from "@/components/settings/tools-tab";

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

const NAV_ICONS: Record<SettingsTabId, string> = {
  accounts: "solar:key-outline",
  models: "solar:cpu-bolt-outline",
  skills: "solar:widget-outline",
  tools: "solar:wrench-outline",
  automation: "solar:bolt-outline",
  appearance: "solar:palette-outline",
};

const TAB_IDS: SettingsTabId[] = [
  "accounts",
  "models",
  "skills",
  "tools",
  "automation",
  "appearance",
];

export type { SettingsTabId };

export function SettingsDialog({ open, onClose, initialTab }: SettingsDialogProps) {
  const t = useT();
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
  }, [initialTab, open]);

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
  }, [isElectron, open]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((response) => response.json())
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
  }, [anthropicKey, defaultModel, hooks, mcpServers, openaiKey, permissions]);

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
    [anthropicKey, defaultModel],
  );

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ModalContent
        title={t.settingsTitle}
        hideHeader
        size="lg"
        className="nodrag flex h-[min(640px,88vh)] w-[780px] max-w-[92vw] flex-col overflow-hidden p-0 max-[720px]:max-w-[96vw]"
      >
        <div className="flex min-h-0 flex-1 overflow-hidden max-[720px]:flex-col">
          <nav
            aria-label="Settings sections"
            className="w-[220px] shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--canvas-subtle)] max-[720px]:w-full max-[720px]:border-r-0 max-[720px]:border-b"
          >
            <div className="flex h-full flex-col gap-[var(--space-5)] py-[var(--space-5)] max-[720px]:gap-[var(--space-3)] max-[720px]:py-[var(--space-3)]">
              <div className="px-[var(--space-4)]">
                <h2 className="text-[var(--text-title)] font-semibold text-[var(--ink)]">
                  {t.settingsTitle}
                </h2>
              </div>

              <div className="flex flex-col gap-[var(--space-1)] px-[var(--space-3)] max-[720px]:flex-row max-[720px]:overflow-x-auto max-[720px]:pb-[var(--space-1)]">
                {TAB_IDS.map((id) => {
                  const isActive = activeTab === id;
                  const label = t[id as keyof typeof t] as string;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "flex w-full min-w-0 items-center gap-[var(--space-3)] whitespace-nowrap rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--text-body-sm)] transition-colors max-[720px]:w-auto max-[720px]:shrink-0",
                        isActive
                          ? "bg-[var(--surface)] font-medium text-[var(--ink)] shadow-[var(--shadow-xs)]"
                          : "text-[var(--ink-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--ink)]",
                      ].join(" ")}
                      title={label}
                    >
                      <Icon
                        icon={NAV_ICONS[id]}
                        width={16}
                        className={isActive ? "shrink-0 text-[var(--accent)]" : "shrink-0"}
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="relative min-w-0 flex-1 overflow-y-auto bg-[var(--surface)]">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-[var(--space-4)] top-[var(--space-4)] z-10 rounded-[var(--radius-sm)] p-[var(--space-1)] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink)]"
              aria-label="Close settings"
            >
              <Icon icon="solar:close-circle-outline" width={18} />
            </button>

            <div className="px-[var(--space-8)] py-[var(--space-6)] pr-[var(--space-12)] max-[720px]:px-[var(--space-4)] max-[720px]:py-[var(--space-5)] max-[720px]:pr-[var(--space-10)]">
              {!settings ? (
                <div className="space-y-[var(--space-4)]">
                  <Skeleton className="h-[20px] w-[160px]" />
                  <Skeleton className="h-[36px] w-full" />
                  <Skeleton className="h-[36px] w-full" />
                  <Skeleton className="mt-[var(--space-4)] h-[20px] w-[160px]" />
                  <Skeleton className="h-[36px] w-full" />
                </div>
              ) : (
                <>
                  {activeTab === "accounts" ? (
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
                  ) : null}

                  {activeTab === "models" ? (
                    <ModelsTab defaultModel={defaultModel} onDefaultModelChange={setDefaultModel} />
                  ) : null}

                  {activeTab === "skills" ? <SkillsTab active={activeTab === "skills"} /> : null}

                  {activeTab === "tools" ? (
                    <ToolsTab
                      active={activeTab === "tools"}
                      mcpServers={mcpServers}
                      onMcpServersChange={setMcpServers}
                    />
                  ) : null}

                  {activeTab === "automation" ? (
                    <AutomationTab
                      hooks={hooks}
                      conventionHooks={conventionHooks}
                      onHooksChange={setHooks}
                      permissions={permissions}
                      onPermissionsChange={setPermissions}
                    />
                  ) : null}

                  {activeTab === "appearance" ? (
                    <AppearanceTab theme={theme} onThemeChange={handleThemeChange} />
                  ) : null}
                </>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-[var(--space-3)] border-t border-[var(--border)] bg-[var(--surface)] px-[var(--space-8)] py-[var(--space-4)] max-[720px]:px-[var(--space-4)] max-[520px]:items-stretch">
              <p className="min-w-0 truncate font-[var(--font-mono)] text-[var(--text-caption)] text-[var(--ink-ghost)]">
                ~/.visagent/config.json
              </p>
              <div className="flex flex-wrap items-center gap-[var(--space-3)] max-[520px]:w-full">
                <Button variant="ghost" size="sm" onClick={onClose} className="max-[520px]:flex-1">
                  {t.cancel}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="max-[520px]:flex-1"
                >
                  {saved ? t.saved : saving ? t.saving : t.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
