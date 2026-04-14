"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Separator, Skeleton, useOverlayState } from "@heroui/react";
import { KeyRound, Brain, Puzzle, Wrench, Zap, Palette } from "lucide-react";
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

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------------
 * Navigation config
 * --------------------------------------------------------------------------- */

type SettingsTabId = "accounts" | "models" | "skills" | "tools" | "automation" | "appearance";

const NAV_ITEMS: { id: SettingsTabId; label: string; icon: typeof KeyRound }[] = [
  { id: "accounts", label: "Accounts", icon: KeyRound },
  { id: "models", label: "Models", icon: Brain },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "tools", label: "Tools & Integrations", icon: Wrench },
  { id: "automation", label: "Automation", icon: Zap },
  { id: "appearance", label: "Appearance", icon: Palette },
];

/* ---------------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------------- */

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

  const state = useOverlayState({
    isOpen: open,
    onOpenChange: (isOpen) => {
      if (!isOpen) onClose();
    },
  });

  const isElectron = typeof window !== "undefined" && !!window.pokeshrimp?.auth;

  // Reset active tab when initialTab changes or dialog opens
  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

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

  // Check if a stored OAuth token exists and is valid
  useEffect(() => {
    if (!open || !isElectron) return;
    window.pokeshrimp?.auth
      ?.getValidToken?.()
      .then((token) => {
        setOauthConnected(!!token);
      })
      .catch(() => {
        setOauthConnected(false);
      });
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
      // ignore
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
    <Modal state={state}>
      <Modal.Backdrop isDismissable />
      <Modal.Container size="lg" className="nodrag max-h-[80vh] w-[720px]">
        <Modal.Dialog className="flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
          {/* Header */}
          <Modal.Header>
            <Modal.Heading>Settings</Modal.Heading>
            <Modal.CloseTrigger />
          </Modal.Header>

          <Separator />

          {/* Body: sidebar + content */}
          <div className="flex min-h-0 flex-1">
            {/* Sidebar */}
            <nav className="w-[180px] shrink-0 border-r border-border py-3">
              <div className="flex flex-col gap-0.5 px-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      fullWidth
                      onPress={() => setActiveTab(item.id)}
                      className="justify-start gap-2"
                    >
                      <Icon size={15} strokeWidth={1.5} />
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
                  <Skeleton className="h-[60px] w-full rounded-lg" />
                  <Skeleton className="h-[60px] w-full rounded-lg" />
                  <Skeleton className="h-[80px] w-full rounded-lg" />
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
                      defaultModel={defaultModel}
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
          <Modal.Footer className="flex items-center justify-between">
            <p className="text-[11px] text-muted/60">Saved to ~/.visagent/config.json</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onPress={handleSave} isDisabled={saving}>
                {saved ? "Saved!" : saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
